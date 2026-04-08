pipeline {
    agent any

    stages {

        stage('Clone Code') {
            steps {
                git 'https://github.com/virinchisrao/studiobookingapp/tree/container'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t startup-app .'
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                sh 'kubectl apply -f k8s/deployment.yaml'
                sh 'kubectl apply -f k8s/service.yaml'
            }
        }
    }
}