import io 
from PIL import Image 
from django.urls import reverse
from rest_framework import status
from django.utils import timezone
from .models import Profile, ProfileToken
from rest_framework.test import APITestCase
from .auth import generateAccessToken, generateRefreshToken
from django.core.files.uploadedfile import SimpleUploadedFile


class AuthTestCase(APITestCase):
    def generatePhotoFile(self):
        img = Image.new('RGB', (100, 100), color='red')
        tempFile = io.BytesIO()
        img.save(tempFile, format='PNG')
        tempFile.name = 'test.png'
        tempFile.seek(0) 
        return SimpleUploadedFile('test.png', tempFile.read(), content_type='image/png')
    
    def testSignup(self):
        url = reverse('signup')
        data = {
            'username' : 'testuser',
            'email'    : 'testuser@example.com',
            'password' : 'Testpass@123',
            'firstName': 'Test',
            'lastName' : 'User',
            'profileIcon' : self.generatePhotoFile() 
        }

        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertTrue(Profile.objects.filter(username='testuser').exists())


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

    def testToggleTheme(self):
        url = reverse('ProfileToggle', args=['theme', 'dark'])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.displayTheme, 'dark')

    def testProfileToggleVisibilityTrue(self):
        url = reverse('ProfileToggle', args=['visibility', 'true'])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.visibility)

    def testProfileToggleVisibilityFalse(self):
        url = reverse('ProfileToggle', args=['visibility', 'false'])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertFalse(self.user.visibility)

    def testInvalidThemeToggleType(self):
        url = reverse('ProfileToggle', args=['theme', 'neon'])
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

    def testLogoutView(self):
        url      = reverse('logout')
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Successfully Logged Out!')

        refreshCookie = response.cookies.get('refreshToken')
        self.assertIsNotNone(refreshCookie)
        self.assertEqual(refreshCookie.value, '')
        self.assertEqual(refreshCookie['max-age'], 0)