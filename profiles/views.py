import random
import string
import jwt, datetime
from PIL import Image
from io import BytesIO
from django.utils import timezone
from rest_framework import status
from django.core.files import File
from django.core.mail import send_mail
from rest_framework.views import APIView
from django.forms import ValidationError
from .serializers import ProfileSerializer
from rest_framework.response import Response
from django.core.validators import validate_email
from .models import Profile, ProfileToken, ResetPassword
from rest_framework.exceptions import AuthenticationFailed, APIException
from .auth import generateAccessToken, generateRefreshToken, JWTAuthentication


def compress(image):
    userImage   = Image.open(image)
    imageIO     = BytesIO()
    imageFormat = userImage.format if userImage.format else 'JPEG'  
    userImage.save(imageIO, imageFormat, quality=60)
    newImage = File(imageIO, name=image.name)
    return newImage


class SignUpView(APIView):
    def post(self, request):
        profileData = request.data.copy()
        profileIcon = profileData.pop('profileIcon', None)
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