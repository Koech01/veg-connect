import io 
import os 
import jwt
import shutil
import tempfile
import pandas as pd
from PIL import Image  
from home.models import City
from unittest.mock import patch
from django.urls import reverse 
from django.conf import settings
from rest_framework import status
from django.utils import timezone
from .models import Profile, ProfileToken
from rest_framework.test import APITestCase
from .auth import generateAccessToken, generateRefreshToken
from django.core.files.uploadedfile import SimpleUploadedFile


def generatePhotoFile():
    img = Image.new('RGB', (100, 100), color='red')
    tempFile = io.BytesIO()
    img.save(tempFile, format='PNG')
    tempFile.name = 'test.png'
    tempFile.seek(0) 
    return SimpleUploadedFile('test.png', tempFile.read(), content_type='image/png')


class SignupTestCase(APITestCase):
    def setUp(self):
        self.url = reverse('signupView')

        self.data = {
            'username' : 'testuser',
            'email'    : 'testuser@example.com',
            'password' : 'Testpass@123',
            'firstName': 'Test',
            'lastName' : 'User',
            'profileIcon' : generatePhotoFile() 
        }

    def test_signup_success(self):
        response = self.client.post(self.url, self.data, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)

        # check user is created.
        user = Profile.objects.filter(username='testuser').first()
        self.assertIsNotNone(user)
        self.assertEqual(user.email, 'testuser@example.com')

        # check cookie is set.
        self.assertIn('refreshToken', response.cookies)
        self.assertTrue(response.cookies['refreshToken']['httponly'])

        # validate token payload.
        token = response.data['token']
        payload = jwt.decode(token, 'secret', algorithms=['HS256'])
        self.assertEqual(payload['id'], user.id)

        # check refresh token is stored
        self.assertTrue(ProfileToken.objects.filter(userId=user.id))


class SigninTestCase(APITestCase):
    def setUp(self): 
        self.url = reverse('loginView')

        self.password = 'Testpass@123'
        self.user = Profile.objects.create_user(
            username    = 'testuser',
            email       = 'testuser@example.com',
            password    = 'Testpass@123',
            guestMode   = False, 
            profileIcon = generatePhotoFile()
        )
    
    def test_login_success(self):
        response = self.client.post(self.url, {'email' : self.user.email, 'password' : self.password})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)

        # Validate token
        accessToken = response.data['token']
        payload = jwt.decode(accessToken, 'secret', algorithms=['HS256'])

        #Check refresh token cookie 
        self.assertIn('refreshToken', response.cookies)
        self.assertTrue(response.cookies['refreshToken']['httponly'])
        
        #Check refresh token model
        self.assertTrue(ProfileToken.objects.filter(userId=self.user.id).exists())

    def test_login_guest_mode(self):
        self.user.guestMode = True
        self.user.save()

        response = self.client.post(self.url, {'email' : self.user.email, 'password' : self.password})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertTrue(response.data.get('guestMode'))

    def test_login_invalid_password(self):
        response = self.client.post(self.url, {'email' : self.user.email, 'password' : 'WrongPass123@'})
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['detail'], 'Invalid Email or Password !')

    def test_login_missing_fields(self):
        response = self.client.post(self.url, {})

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['detail'], 'user with this email does not exist.')


class RefreshTokenTestCase(APITestCase):
    def setUp(self):
        self.url = reverse('refreshView')

        self.user = Profile.objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='Testpass@123',
            profileIcon=generatePhotoFile()
        )

        self.refreshToken = generateRefreshToken(self.user.id)
        self.expiredAt = timezone.now() + timezone.timedelta(days=7)

        ProfileToken.objects.create(
            userId=self.user.id,
            token=self.refreshToken,
            expiredAt=self.expiredAt
        )

    def test_refresh_success(self):
        self.client.cookies['refreshToken'] = self.refreshToken
        response = self.client.post(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('accessToken', response.data)

        payload = jwt.decode(response.data['accessToken'], 'secret', algorithms=['HS256'])
        self.assertEqual(payload['id'], self.user.id)

    def test_refresh_missing_cookie(self):
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['detail'], 'Invalid Username or Password!')

    def test_refresh_expired_token(self): 
        ProfileToken.objects.filter(userId=self.user.id).delete()
        expiredToken = generateRefreshToken(self.user.id)
        expiredTime  = timezone.now() - timezone.timedelta(days=1)

        ProfileToken.objects.create(
            userId=self.user.id,
            token=expiredToken,
            expiredAt=expiredTime
        )

        self.client.cookies['refreshToken'] = expiredToken
        response = self.client.post(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['detail'], 'Invalid Username or Password!')

    def test_refreshToken_not_in_dB(self): 
        ProfileToken.objects.filter(userId=self.user.id).delete()

        fake_token = generateRefreshToken(self.user.id)
        self.client.cookies['refreshToken'] = fake_token

        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['detail'], 'Invalid Username or Password!')

    def test_refresh_invalid_jwt(self):
        self.client.cookies['refreshToken'] = "invalid.jwt.token"
        response = self.client.post(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['detail'], 'Invalid Username or Password!')
    

class ProfileUpdateViewTestCase(APITestCase):
    def setUp(self):
        self.url = reverse('refreshView')

        self.user = Profile.objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='Testpass@123',
            profileIcon=generatePhotoFile()
        )

        self.accessToken = generateAccessToken(self.user.id)
        self.refreshToken = generateRefreshToken(self.user.id)

        ProfileToken.objects.create(
            userId=self.user.id,
            token=self.refreshToken,
            expiredAt=timezone.now() + timezone.timedelta(days=7)
        )

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.accessToken}')
        self.url = reverse('profileUpdateView')   

    def test_profile_update_success(self):
        payload = {
            'username' : 'updateduser',
            'firstName': 'Updated',
            'lastName': 'User',
            'email': 'updated@example.com'
        }

        response = self.client.patch(self.url, payload, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.username, 'updateduser')
        self.assertEqual(self.user.email, 'updated@example.com')

    def test_profile_invalid_email_format(self):
        payload = { 'email': 'invalid-email' }

        response = self.client.patch(self.url, payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_profile_update_email_already_exist(self):
        Profile.objects.create_user(
            username='otheruser',
            email='duplicate@example.com',
            password='Testpass@123'
        )

        payload = { 'email': 'duplicate@example.com' }

        response = self.client.patch(self.url, payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_profile_update_email_blank(self):
        payload = { 'email': '' }

        response = self.client.patch(self.url, payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_profile_icon_update(self):
        def generateUserIcon():
            img = Image.new('RGB', (100, 100), color='red')
            tempFile = io.BytesIO()
            img.save(tempFile, format='PNG')
            tempFile.seek(0)
            return SimpleUploadedFile('testImage.png', tempFile.read(), content_type='image/png')

        payload = {'profileIcon': generateUserIcon()}

        old_icon = self.user.profileIcon.name

        response = self.client.patch(self.url, payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user.refresh_from_db() 

        self.assertNotEqual(self.user.profileIcon.name, old_icon)
        self.assertTrue(self.user.profileIcon.name.endswith('.png'))
 
    def test_climate_change_creates_new_city(self):
        payload = {
            'countryName': 'Kenya',
            'cityName': 'Nairobi',
            'precipitation': 'Wet'
        }

        response = self.client.patch(self.url, payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user.refresh_from_db()
        self.assertIsNotNone(self.user.climate)
        self.assertEqual(self.user.climate.country.lower(), 'kenya')
        self.assertEqual(self.user.climate.name.lower(), 'nairobi')
        self.assertEqual(self.user.climate.precipitationClass.lower(), 'wet')

    def test_unauthenticated_profile_update(self):
        self.client.credentials()  
        data = {'username': 'unauthuser'}
        response = self.client.patch(self.url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ProfileClimateViewTestCase(APITestCase):
    def setUp(self):
        self.url = reverse('userClimateView')
        self.user = Profile.objects.create_user(
            username = 'testuser',
            email    = 'testuser@example.com',
            password = 'Testpass@123'
        )

        self.accessToken = generateAccessToken(self.user.id)
        self.refreshToken = generateRefreshToken(self.user.id)

        ProfileToken.objects.create(
            userId    = self.user.id,
            token     = self.refreshToken,
            expiredAt = timezone.now() + timezone.timedelta(days=7)
        )

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.accessToken}')

    def test_successful_climate_update(self):
        payload = {
            'countryName': 'Kenya',
            'cityName': 'Nairobi',
            'precipitation': 'Wet'
        }

        response = self.client.patch(self.url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()

        self.assertIsNotNone(self.user.climate)
        self.assertEqual(self.user.climate.country, 'Kenya')
        self.assertEqual(self.user.climate.name, 'Nairobi')
        self.assertEqual(self.user.climate.precipitationClass, 'Wet')

    def test_missing_country_name(self):
        payload = {
            'cityName': 'Nairobi', 
            'precipitation': 'Wet'
        }

        response = self.client.patch(self.url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Country name is required.', response.data.get('error', ''))

    def test_missing_city_name(self):
        payload = {
            'countryName': 'Kenya', 
            'precipitation': 'Wet'
        }

        response = self.client.patch(self.url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('City name is required.', response.data.get('error', ''))

    def test_missing_precipitation(self):
        payload = {
            'countryName': 'Kenya', 
            'cityName': 'Nairobi'
        }

        response = self.client.patch(self.url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('City precipitation is required.', response.data.get('error', ''))

    def test_city_exist(self):
        City.objects.create(name='Nairobi', country='Kenya', precipitationClass='Wet')
        payload = {
            'countryName': 'Kenya',
            'cityName': 'Nairobi',
            'precipitation': 'Wet'
        }

        response = self.client.patch(self.url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()

        self.assertEqual(City.objects.filter(name__iexact='Nairobi').count(), 1)

    def test_unauth_user_cannot_access_endpoint(self):
        self.client.credentials()
        response = self.client.patch(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class OnboardingPlantListTestCase(APITestCase):
    def setUp(self):
        self.url = reverse('userPlantListView')
        self.user = Profile.objects.create_user(
            username='onboarduser',
            email='onboard@example.com',
            password='StrongPass123!'
        )

        self.accessToken = generateAccessToken(self.user.id)
        self.refreshToken = generateRefreshToken(self.user.id)

        ProfileToken.objects.create(
            userId=self.user.id,
            token=self.refreshToken,
            expiredAt=timezone.now() + timezone.timedelta(days=7)
        )

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.accessToken}')

        self.originalCsvPath = os.path.join(settings.BASE_DIR, 'verdant', 'plantNames.csv')
        self.backupCsvPath = self.originalCsvPath + ".backup"
        self.tempDir = tempfile.mkdtemp()
        self.mockCsvPath = os.path.join(self.tempDir, 'plantNames.csv')

        if os.path.exists(self.originalCsvPath):
            shutil.copy(self.originalCsvPath, self.backupCsvPath)

    def tearDown(self):  
        if os.path.exists(self.backupCsvPath):
            shutil.copy(self.backupCsvPath, self.originalCsvPath)
            os.remove(self.backupCsvPath)

        if os.path.exists(self.mockCsvPath):
            os.remove(self.mockCsvPath)
        shutil.rmtree(self.tempDir, ignore_errors=True)

    def create_mock_csv(self, plantNames):
        df = pd.DataFrame(plantNames, columns=['name'])
        df.to_csv(self.mockCsvPath, index=False, header=False)

        verdantPath = os.path.join(settings.BASE_DIR, 'verdant')
        os.makedirs(verdantPath, exist_ok=True)
        shutil.copy(self.mockCsvPath, self.originalCsvPath)

    def test_successful_plant_list_fetch(self):
        validPlants = ['Mango', 'Tomato', 'Carrot']
        self.create_mock_csv(validPlants)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        responsePlants = response.data
        self.assertIn('mango', responsePlants)
        self.assertIn('tomato', responsePlants)
        self.assertIn('carrot', responsePlants)

    def test_csv_file_missing(self):
        if os.path.exists(self.originalCsvPath):
            os.remove(self.originalCsvPath)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data.get('error'), 'CSV not found')

    def test_unauth_user_cannot_access_endpoint(self):
        self.client.credentials()
        response = self.client.patch(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ProfileUpdatePlantInterestsViewTestCase(APITestCase):
    def setUp(self):
        self.url = reverse('userPlantChoicesView')
        self.user = Profile.objects.create_user(
            username='plantlover',
            email='plantlover@example.com',
            password='SecurePass123!'
        )
        self.accessToken = generateAccessToken(self.user.id)
        self.refreshToken = generateRefreshToken(self.user.id)

        ProfileToken.objects.create(
            userId=self.user.id,
            token=self.refreshToken,
            expiredAt=timezone.now() + timezone.timedelta(days=7)
        )

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.accessToken}')

        self.originalCsvPath = os.path.join(settings.BASE_DIR, 'verdant', 'vectorised-plant-dataset.csv')
        self.tempDir = tempfile.mkdtemp()
        self.mockCsvPath = os.path.join(self.tempDir, 'vectorised-plant-dataset.csv')

        self._original_read_csv = pd.read_csv
        self.should_patch_read_csv = True
        pd.read_csv = self.mock_read_csv

    def tearDown(self):
        if self.should_patch_read_csv:
            pd.read_csv = self._original_read_csv
            shutil.rmtree(self.tempDir, ignore_errors=True)

    def mock_read_csv(self, path, *args, **kwargs):
        return self._original_read_csv(self.mockCsvPath, *args, **kwargs)

    def create_mock_dataset(self, rows):
        columns = [
            "Common name", "Scientific name", "Family", "Width", "Height", "Soil pH",
            "USDA Hardiness Zone", "Water Requirement", "Life cycle", "Soil type",
            "Light requirement", "Utility", "Alternate name", "Task Recommendations."
        ]
        df = pd.DataFrame(rows, columns=columns)
        df.to_csv(self.mockCsvPath, index=False)

    def test_successful_patch_updates_user_plant_interests(self):
        self.create_mock_dataset([
            {
                "Common name": "Tomato",
                "Scientific name": "Solanum lycopersicum",
                "Family": "Solanaceae",
                "Width": 0.5,
                "Height": 1.0,
                "Soil pH": "6.0 - 7.0",
                "USDA Hardiness Zone": "10",
                "Water Requirement": "Moist",
                "Life cycle": "Annual",
                "Soil type": "Loamy",
                "Light requirement": "Full Sun",
                "Utility": "Edible, Medicinal",
                "Alternate name": "Tomato Plant",
                "Task Recommendations.": "Water regularly."
            }
        ])

        payload = { "selectedPlants": ["Tomato"] }
        response = self.client.patch(self.url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'User Plant interests updated successfully.')
        self.user.refresh_from_db()
        self.assertTrue(self.user.plantInterests.filter(commonName="Tomato").exists())

    def test_patch_with_missing_selectedPlants_returns_400(self):
        response = self.client.patch(self.url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'No plants selected.')

    def test_patch_with_missing_csv_returns_500(self): 
        pd.read_csv = self._original_read_csv
        self.should_patch_read_csv = False
 
        with patch('os.path.exists', return_value=False):
            response = self.client.patch(self.url, {"selectedPlants": ["Tomato"]}, format='json')

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.data['error'], 'Plant dataset not found.')

    def test_patch_with_unmatched_plant_name_does_nothing(self):
        self.create_mock_dataset([]) 
        response = self.client.patch(self.url, {"selectedPlants": ["NonexistentPlant"]}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.plantInterests.count(), 0)

    def test_unauthenticated_user_is_forbidden(self):
        self.client.credentials()
        response = self.client.patch(self.url, {"selectedPlants": ["Tomato"]}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ProfileThemeViewTestCase(APITestCase):
    def setUp(self):
        self.user = Profile.objects.create_user(
            username = 'testuser',
            email    = 'testuser@example.com',
            password = 'Testpass@123'
        )

        self.accessToken = generateAccessToken(self.user.id)
        self.refreshToken = generateRefreshToken(self.user.id)

        ProfileToken.objects.create(
            userId    = self.user.id,
            token     = self.refreshToken,
            expiredAt = timezone.now() + timezone.timedelta(days=7)
        )

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.accessToken}')

    def test_toggle_theme(self):
        url = reverse('ProfileToggleView', args=['theme', 'dark'])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.displayTheme, 'dark')

    def test_profile_toggle_visibility_true(self):
        url = reverse('ProfileToggleView', args=['visibility', 'true'])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.visibility)

    def test_profile_toggle_visibility_false(self):
        url = reverse('ProfileToggleView', args=['visibility', 'false'])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertFalse(self.user.visibility)

    def test_invalid_theme_toggle_type(self):
        url = reverse('ProfileToggleView', args=['theme', 'neon'])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.refresh_from_db()
        self.assertEqual(self.user.displayTheme, 'light')


class LogoutViewTestCase(APITestCase):
    def setUp(self):
        self.user = Profile.objects.create_user(
            username = 'testuser',
            email    = 'testuser@example.com',
            password = 'Testpass@123'
        )

        self.accessToken  = generateAccessToken(self.user.id)
        self.refreshToken = generateRefreshToken(self.user.id)

        ProfileToken.objects.create(
            userId    = self.user.id,
            token     = self.refreshToken,
            expiredAt = timezone.now() + timezone.timedelta(days=7)
        )

        self.client.cookies['refreshToken'] = self.refreshToken
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.accessToken}')

    def test_logout_view(self):
        url      = reverse('logoutView')
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Successfully Logged Out!')

        refreshCookie = response.cookies.get('refreshToken')
        self.assertIsNotNone(refreshCookie)
        self.assertEqual(refreshCookie.value, '')
        self.assertEqual(refreshCookie['max-age'], 0)