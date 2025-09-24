import os
import random
import string
import pandas as pd
import jwt, datetime
from PIL import Image
from io import BytesIO
from home.models import City
from django.conf import settings 
from django.db import transaction 
from rest_framework import status
from django.utils import timezone 
from django.core.files import File
from django.core.mail import send_mail
from rest_framework.views import APIView
from django.forms import ValidationError
from .serializers import ProfileSerializer
from rest_framework.response import Response
from django.core.validators import validate_email
from rest_framework.permissions import IsAuthenticated 
from .models import Profile, ProfileToken, ResetPassword 
from plants.models import Plant, LifeCycle, LightRequirement, SoilType 
from rest_framework.exceptions import AuthenticationFailed, APIException
from .auth import generateAccessToken, generateRefreshToken, JWTAuthentication


def compress(image):
    userImage = Image.open(image)
    imageIO   = BytesIO()
    imageFormat = userImage.format if userImage.format else 'JPEG'  
    userImage.save(imageIO, imageFormat, quality=60)
    newImage = File(imageIO, name=image.name)
    return newImage


class SignUpView(APIView):
    def post(self, request):
        profileData = request.data.copy()
        profileIcon = request.FILES.get('profileIcon')
        serializer  = ProfileSerializer(data=profileData)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()

        if profileIcon:
            profile.profileIcon = profileIcon
        profile.save()
        
        accessToken  = generateAccessToken(profile.id)
        refreshToken = generateRefreshToken(profile.id)
        expiredAt    = timezone.now() + timezone.timedelta(days=7)

        ProfileToken.objects.create(
            userId    = profile.id,
            token     = refreshToken,
            expiredAt = expiredAt
        )
        
        response = Response()

        response.set_cookie(key='refreshToken', value=refreshToken, httponly=True, samesite='None', secure=True)

        response.data = { 'token' : accessToken }
        return response


class LoginView(APIView):
    def post(self, request):
        email    = request.data.get('email')
        password = request.data.get('password')
        profile  = Profile.objects.filter(email=email).first()

        if profile is None:
            raise AuthenticationFailed('user with this email does not exist.') 

        if profile is not None and not profile.check_password(password):
            raise AuthenticationFailed('Invalid Email or Password !')
        
        accessToken  = generateAccessToken(profile.id)
        refreshToken = generateRefreshToken(profile.id)
        expiredAt    = timezone.now() + timezone.timedelta(days=7)

        ProfileToken.objects.create(
            userId    = profile.id,
            token     = refreshToken,
            expiredAt = expiredAt
        )
        
        response = Response()

        response.set_cookie(key='refreshToken', value=refreshToken, httponly=True, samesite='None', secure=True)

        if profile.guestMode:
            response.data = { 'token': accessToken, 'guestMode': True }
        else:
            response.data = { 'token': accessToken } 
        return response


class RefreshApiView(APIView):
    def post(self, request):
        refreshToken = request.COOKIES.get('refreshToken')
        try:
            payload = jwt.decode(refreshToken, 'secret', algorithms=['HS256']).get('id')
        except:
            raise AuthenticationFailed('Invalid Username or Password!')
        
        if not ProfileToken.objects.filter(
            userId        = payload,
            token         = refreshToken,
            expiredAt__gt = datetime.datetime.now(tz=datetime.timezone.utc)
        ).exists():
            raise AuthenticationFailed('Invalid Username or Password!')

        accessToken = generateAccessToken(payload)

        return Response({ 'accessToken' : accessToken })
 

class ProfileClimateView(APIView): 
    authentication_classes = [JWTAuthentication]

    def patch(self, request):
        try:
            profile = Profile.objects.get(username=request.user)
        except Profile.DoesNotExist:
            return Response({ 'error' : 'User not found.' }, status=status.HTTP_404_NOT_FOUND)

        countryName = request.data.get('countryName') 
        cityName = request.data.get('cityName') 
        precipitation = request.data.get('precipitation') 

        if not countryName:
            return Response({'error' : 'Country name is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
        if not cityName:
            return Response({'error' : 'City name is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not precipitation:
            return Response({'error' : 'City precipitation is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        city, created = City.objects.get_or_create(
            name__iexact=cityName,
            defaults={
                'country': countryName.strip().title(),
                'name': cityName.strip().title(),
                'precipitationClass': precipitation
            }
        )

        profile.climate = None  
        profile.climate = city
        profile.save() 
        serializer = ProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)


class OnboardingPlantListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
 
    def get(self, request):
        path = os.path.join(settings.BASE_DIR, 'verdant', 'plantNames.csv')

        if not os.path.exists(path):
            return Response({'error' : 'CSV not found'}, status=status.HTTP_404_NOT_FOUND) 

        df = pd.read_csv(path, header=None, names=["name"])
        df['name'] = df['name'].str.strip().str.lower()

        plantNames = [
            'Apple', 'Avocado', 'Blackberry', 'Cabbage', 'Carrot', 'Chili', 
            'Corn', 'Eggplant', 'Garlic', 'Kiwi',
            'Mango', 'Olive', 'Potato', 'Spinach',
            'Strawberry', 'Tomato', 'Walnut', 'Yam'
        ]

        plantNames = [name.lower() for name in plantNames] 
        filtered = df[df['name'].isin(plantNames)] 
        return Response(filtered['name'].tolist())


class ProfileUpdatePlantInterestsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        selectedPlants = request.data.get('selectedPlants', [])
        if not selectedPlants:
            return Response({'error': 'No plants selected.'}, status=status.HTTP_400_BAD_REQUEST)

        path = os.path.join(settings.BASE_DIR, 'verdant', 'vectorised-plant-dataset.csv')

        if not os.path.exists(path):
            return Response({'error': 'Plant dataset not found.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        plantDf = pd.read_csv(path)

        with transaction.atomic():
            profile = request.user
            for plant_name in selectedPlants:
                plantRow = plantDf[
                    (plantDf['Common name'].astype(str).str.strip().str.lower() == plant_name.strip().lower()) |
                    (plantDf['Scientific name'].astype(str).str.strip().str.lower() == plant_name.strip().lower()) |
                    (plantDf['Alternate name'].astype(str).str.lower().str.contains(plant_name.strip().lower(), na=False))
                ]

                if plantRow.empty:
                    continue

                row = plantRow.iloc[0]

                plantObj, created = Plant.objects.get_or_create(
                    commonName=str(row.get('Common name', '')).strip(),
                    scientificName=str(row.get('Scientific name', '')).strip(),
                    defaults={
                        'family': str(row.get('Family', 'Unknown')).strip(),
                        'width': float(row.get('Width', 0.0) or 0.0),
                        'height': float(row.get('Height', 0.0) or 0.0),
                        'soilpH': str(row.get('Soil pH', '6.0 - 7.0')).strip(),
                        'usdaHardinessZone': str(row.get('USDA Hardiness Zone', 'Unknown')).strip(),
                        'waterRequirement': str(row.get('Water Requirement', 'Moist')).strip(),
                        'utility': str(row.get('Utility', '')).strip(),
                        'alternateNames': str(row.get('Alternate name', '')).strip(),
                        'taskRecommendations': str(row.get('Task Recommendations.', '')).strip(),
                    }
                )

                for lCycle in str(row.get('Life cycle', '')).split(','):
                    name = lCycle.strip()
                    if name:
                        lifeCycle, _ = LifeCycle.objects.get_or_create(name=name)
                        plantObj.lifeCycles.add(lifeCycle)

                for sType in str(row.get('Soil type', '')).split(','):
                    name = sType.strip()
                    if name:
                        soilType, _ = SoilType.objects.get_or_create(name=name)
                        plantObj.soilTypes.add(soilType)

                for lRequirement in str(row.get('Light requirement', '')).split(','):
                    name = lRequirement.strip()
                    if name:
                        lightReq, _ = LightRequirement.objects.get_or_create(name=name)
                        plantObj.lightRequirements.add(lightReq)

                profile.plantInterests.add(plantObj)

        return Response({'message': 'User Plant interests updated successfully.'}, status=status.HTTP_200_OK)


class ProfileUpdateView(APIView):
    authentication_classes = [JWTAuthentication]

    def patch(self, request):
        try:
            profile = Profile.objects.get(username=request.user)
        except Profile.DoesNotExist:
            return Response({ 'error' : 'User not found.' }, status=status.HTTP_404_NOT_FOUND)
        
        data     = request.data
        newEmail = data.get('email', profile.email)

        if newEmail != profile.email and Profile.objects.filter(email=newEmail).exclude(id=profile.id).exists():
            return Response({'error': 'This email is already taken.'}, status=status.HTTP_400_BAD_REQUEST)
        elif len(newEmail) == 0:
            return Response({'error': 'Email cannot be blank.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            try:
                validate_email(newEmail)
            except ValidationError:
                return Response({'error': 'Invalid email address.'}, status=status.HTTP_400_BAD_REQUEST)
        
        profile.username  = data.get('username', profile.username)
        profile.firstName = data.get('firstName', profile.firstName)
        profile.lastName  = data.get('lastName', profile.lastName)
        profile.email     = newEmail
        profilePicture    = request.FILES.get('profileIcon')
        countryName       = data.get('countryName')
        cityName          = data.get('cityName')
        precipitation     = data.get('precipitation')

        if countryName and cityName and precipitation:
            normalizedCity = cityName.strip().title()
            normalizedCountry = countryName.strip().title()

            currentCity = profile.climate
            climateChanged = (
                not currentCity or
                currentCity.name.lower() != normalizedCity.lower() or
                currentCity.country.lower() != normalizedCountry.lower() or
                currentCity.precipitationClass != precipitation
            )

            if climateChanged:
                city, created = City.objects.get_or_create(
                    name__iexact=normalizedCity,
                    country=normalizedCountry,
                    precipitationClass=precipitation,
                    defaults={
                        'name': normalizedCity,
                        'country': normalizedCountry,
                        'precipitationClass': precipitation
                    }
                )
                profile.climate = city
 
        if profilePicture:
            compressedImage     = compress(profilePicture)
            profile.profileIcon = compressedImage
        profile.save()

        try: 
            serializer = ProfileSerializer(profile)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error' : str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ProfileToggleView(APIView):
    authentication_classes = [JWTAuthentication]

    def post(self, request, toggleType, toggleVal):
        try:
            profile = Profile.objects.get(username=request.user)
        except Profile.DoesNotExist:
            return Response({ 'error' : 'User not found.' }, status=status.HTTP_404_NOT_FOUND)
        
        if toggleType == 'theme':
            if toggleVal in ['light', 'dark']:
                profile.displayTheme = toggleVal

                try: 
                    profile.save()
                    serializer = ProfileSerializer(profile)
                    return Response(serializer.data, status=status.HTTP_200_OK)
                except Exception as e:
                    return Response({'error' : str(e)}, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({'error' : 'Invalid theme value.'}, status=status.HTTP_400_BAD_REQUEST)
        
        elif toggleType == 'visibility':
            profile.visibility = toggleVal == 'true' 
            
            try: 
                profile.save()
                serializer = ProfileSerializer(profile)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({'error' : str(e)}, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    def post(self, request):
        refreshToken = request.COOKIES.get('refreshToken')
        ProfileToken.objects.filter(token=refreshToken).delete()
        response = Response()
        response.delete_cookie(key='refreshToken')
        response.data = { 'message' : 'Successfully Logged Out!' }
        return response
    

class ForgotPasswordView(APIView):
    def post(self, request):
        email = request.data.get('email')
        token = ''.join(random.choice(string.ascii_lowercase + string.digits) for _ in range(10))

        try: validate_email(email)
        except ValidationError:
            raise ValidationError('Enter a valid email address.')

        ResetPassword.objects.create(email = email, token = token)

        url = f"http://localhost:3000/reset/{token}/"

        send_mail(
            subject        = "Reset your password!",
            message        = f"Click {url} to reset your password",
            from_email     = "koechcareer@gmail.com",
            recipient_list = [email]
        )

        return Response({ "message" : "Email Sent!" })


class ResetPasswordView(APIView):
    def post(self, request):
        token       = request.data.get('token')
        password    = request.data.get('password')
        confirmPass = request.data.get('confirmPass')

        if password != confirmPass:
            raise APIException("Passwords do not match")
    
        resetPassword = ResetPassword.objects.filter(token=token).first()

        if not resetPassword:
            raise APIException("Invalid Link")

        profile = Profile.objects.filter(email=resetPassword.email).first()

        if not profile:
            raise APIException("Profile not found")

        profile.set_password(password)
        profile.save()

        accessToken  = generateAccessToken(profile.id)
        refreshToken = generateRefreshToken(profile.id)
        expiredAt    = timezone.now() + timezone.timedelta(days=7)

        ProfileToken.objects.create(
            userId    = profile.id,
            token     = refreshToken,
            expiredAt = expiredAt
        )
        
        response = Response()

        response.set_cookie(key='refreshToken', value=refreshToken, httponly=True, samesite='None', secure=True)

        response.data = { 'token' : accessToken }
        return response