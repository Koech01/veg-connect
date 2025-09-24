# Veg-Connect Setup Guide
A data-driven React-Django app that delivers a content-based recommendation system responsible for suggesting plant pairings that work well together, such as combining nitrogen fixers with nitrogen feeders and tailored planting tasks with instructions for each suggested crop. It allows users to manage and share farming tasks in topic-specific communities via a WebSocket chat. 

# Table of Contents
    - Prerequisites.
    - Installation.
    - Environment Setup.
    - Frontend Setup. 
    - Docker Setup.
    - Running the Application. 
    - License. 

# Prerequisites
Before you begin, ensure you have the following installed:
- [Git](https://git-scm.com/downloads)
- [Python](https://www.python.org/downloads/) (3.x)
- [Node.js](https://nodejs.org/en/download)
- [virtualenv](https://virtualenv.pypa.io/en/latest/installation.html)
- [Docker](https://docs.docker.com/engine/install/)

# Installation
Clone the repository and set up your virtual environment:

1. Clone the repository:
```bash
git clone https://github.com/Koech01/veg-connect.git
virtualenv veg-connect/
cd veg-connect
```

2. Install dependencies:
```bash
source bin/activate
pip install -r requirements.txt
```

# Environment Setup.
Configure the environment:

1. Create an .env file:
```bash
touch .env 
```

2. Generate a Django secret key:
```bash
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

3. Open the `.env` file and add the following lines, with your newly generated secret key for `SECRET_KEY`. Make sure to keep DEBUG=True for local development:
```env
SECRET_KEY=your_generated_secret_key_here
DEBUG=True
```

# Frontend Setup.

1. Set up the frontend by navigating to the frontend directory and installing dependencies:
```bash
cd frontend
npm install
npm run build
cd ..
```

# Docker Setup.

1. Make sure Docker is running before starting Redis or other containers:
```bash
sudo systemctl start docker
sudo systemctl enable docker
sudo systemctl status docker 
```

# Running the Application.

1. For chat functionality, ensure Redis is running:
```bash
sudo docker run -d -p 6379:6379 redis 
```
Enter your password.

2. Start the Django development server:
```bash
python manage.py runserver 
```
You can now access the application at `http://127.0.0.1:8000/`.

# License.
This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).