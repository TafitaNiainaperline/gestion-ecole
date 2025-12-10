pipeline {
 
    agent {
        node {
            label 'FS'
            customWorkspace '/Codes/fiharysoft/fs-school/fs-school-backend'
        }
    } 
   
    environment {
        PROJECT_NAME     = 'fs-school-backend:8030'
        CODES_DIR        = '/Codes/fiharysoft/fs-school/fs-school-backend'
        RELEASE_DIR      = '/Release/FiharySoft/fs-school/fs-school-backend'
        ENV_DIR          =  '/Codes/env/fs-school-backend/'
        GIT_REPO         = 'git@github.com:fiharysoft/fs-school-backend.git'
        GIT_BRANCH       = 'main' 
        NODE_VERSION     = 'Nodejs24.11'
        PM2_APP_NAME     = 'fs-school-backend:8030'
        PM2_PORT         = '8030'
        GIT_COMMIT_MSG   = ''
        GIT_AUTHOR       = ''
        GIT_AUTHOR_EMAIL = ''
        START_TIME       = ''
        END_TIME         = ''
    }

    tools {
        git 'Default'
        nodejs "${NODE_VERSION}"
    }

    stages {

        stage('Démarrage') {
            steps {
                script {
                    env.START_TIME = sh(script: "date '+%d/%m/%Y %H:%M:%S'", returnStdout: true).trim()
                    echo "⏰ Pipeline démarré à: ${env.START_TIME}"
                }
            }
        }

        stage('Checkout') {
            steps {
                dir("${CODES_DIR}") {
                    sshagent(credentials: ['cle_ssh_jenkins']) {
                        sh '''
                            if [ -d ".git" ]; then
                                echo "📦 Repository existe, reset + pull..."
                                git reset --hard HEAD
                                git clean -fd
                                git remote set-url origin ${GIT_REPO}
                                git fetch origin
                                git checkout ${GIT_BRANCH}
                                git pull origin ${GIT_BRANCH}
                            else
                                echo "🔄 Clonage du repository..."
                                git clone -b ${GIT_BRANCH} ${GIT_REPO} .
                            fi

                            echo "📋 État du repository:"
                            git log --oneline -5
                        '''
                    }
                }
                script {
                    dir("${CODES_DIR}") {
                        sh '''
                            git log -1 --pretty=%B > /tmp/git_msg.txt
                            git log -1 --pretty=%an > /tmp/git_author.txt
                            git log -1 --pretty=%ae > /tmp/git_email.txt
                        '''
                        env.GIT_COMMIT_MSG = readFile('/tmp/git_msg.txt').trim()
                        env.GIT_AUTHOR = readFile('/tmp/git_author.txt').trim()
                        env.GIT_AUTHOR_EMAIL = readFile('/tmp/git_email.txt').trim()
                    }
                    echo "✅ Auteur: ${env.GIT_AUTHOR}"
                    echo "✅ Email: ${env.GIT_AUTHOR_EMAIL}"
                    echo "✅ Message: ${env.GIT_COMMIT_MSG}"
                    
                    // Envoyer notification avec les infos maintenant disponibles
                    notifyDiscord('START', 'Pipeline')
                }
            }
        }

        stage('Notification Push Reçue') {
            steps {
                echo "🚀 Push détecté sur ${env.GIT_BRANCH}"
            }
        }

        stage('Installation Dépendances') {
            steps {
                dir("${CODES_DIR}") {
                    nodejs(nodeJSInstallationName: "${NODE_VERSION}") {
                        sh '''
                            if ! command -v yarn &> /dev/null; then
                                npm install -g yarn
                            fi

                            echo "📦 Installation des dépendances..."
                            yarn install
                        '''
                    }
                }
            }
        }

        stage('Build') {
            steps {
                dir("${CODES_DIR}") {
                    nodejs(nodeJSInstallationName: "${NODE_VERSION}") {
                        sh '''
                            [ -f "${CODES_DIR}/.env" ] && rm "${CODES_DIR}/.env"
                            cp ${ENV_DIR}/.env ${CODES_DIR}
                            echo "⚙️ Build de l'application..."
                            yarn run build
                        '''
                    }
                }
                script {
                    notifyDiscord('BUILD', 'Build terminé')
                }
            }
        }

        stage('Préparation Dossier Release') {
            steps {
                sh '''
                    [ -d "${RELEASE_DIR}/dist" ] && rm -rf "${RELEASE_DIR}/dist"
                    cp -r "${CODES_DIR}/dist" "${RELEASE_DIR}/"

                    [ -f "${RELEASE_DIR}/package.json" ] && rm "${RELEASE_DIR}/package.json"
                    cp "${CODES_DIR}/package.json" "${RELEASE_DIR}/"

                    [ -f "${RELEASE_DIR}/yarn.lock" ] && rm "${RELEASE_DIR}/yarn.lock"
                    cp "${CODES_DIR}/yarn.lock" "${RELEASE_DIR}/"

                    [ -f "${RELEASE_DIR}/.env" ] && rm "${RELEASE_DIR}/.env"
                    cp ${ENV_DIR}/.env ${RELEASE_DIR}

                    [ -f "${RELEASE_DIR}/tsconfig.json" ] && rm "${RELEASE_DIR}/tsconfig.json"
                    cp "${CODES_DIR}/tsconfig.json" "${RELEASE_DIR}/"
                    

                '''
            }
        }

        stage('Installation Dépendances Production') {
            steps {
                dir("${RELEASE_DIR}") {
                    nodejs(nodeJSInstallationName: "${NODE_VERSION}") {
                        sh 'yarn install '
                    }
                }
            }
        }

        stage('Déploiement PM2') {
            steps {
                dir("${RELEASE_DIR}") {
                    sh '''
                        if ! command -v pm2 &> /dev/null; then
                            npm install pm2 -g
                        fi

                        if pm2 describe ${PM2_APP_NAME} > /dev/null 2>&1; then
                            echo "♻️ Redémarrage de ${PM2_APP_NAME}..."
                            pm2 restart ${PM2_APP_NAME}
                        else
                            echo "🚀 Première installation de ${PM2_APP_NAME}"
                            cat > ecosystem.config.js <<EOF
module.exports = {
    apps: [{
    name: '${PM2_APP_NAME}' ,
    script: 'dist/main.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: '${PM2_PORT}'
        },
    }]
};
EOF
                            pm2 start ecosystem.config.js
                        fi

                        pm2 save
                    '''
                }
            }
        }

        stage('Vérification Déploiement') {
            steps {
                sh '''
                    sleep 10
                    if pm2 jlist | grep -q "${PM2_APP_NAME}"; then
                        echo "✅ ${PM2_APP_NAME} est en ligne"
                        if curl -f -s -o /dev/null http://localhost:${PM2_PORT} || curl -f -s -o /dev/null http://localhost:${PM2_PORT}/health; then
                            echo "✅ Test de santé OK"
                        else
                            echo "⚠️ Test de santé échoué, mais l'app semble démarrée"
                        fi
                    else
                        echo "❌ Application pas en ligne"
                        pm2 logs ${PM2_APP_NAME} --lines 20
                        exit 1
                    fi
                '''
            }
        }
    }

    post {
        success {
            script {
                env.END_TIME = sh(script: "date '+%d/%m/%Y %H:%M:%S'", returnStdout: true).trim()
                notifyDiscord('SUCCESS', 'Déploiement réussi')
            }
            echo "🎉 Déploiement réussi: ${env.PM2_APP_NAME} sur port ${env.PM2_PORT}"
        }
        failure {
            script {
                env.END_TIME = sh(script: "date '+%d/%m/%Y %H:%M:%S'", returnStdout: true).trim()
                notifyDiscord('FAILURE', 'Déploiement échoué')
                echo "💥 Déploiement échoué"
                sh "pm2 logs ${env.PM2_APP_NAME} --lines 20 || echo 'Aucune instance PM2 trouvée'"
            }
        }
        always {
            echo "📊 Statut final PM2:"
            sh "pm2 status || echo 'PM2 non disponible'"
        }
    }
}

// Fonction pour envoyer les notifications Discord
void notifyDiscord(String status, String stage) {
    withCredentials([string(credentialsId: 'discord_webhooks', variable: 'DISCORD_WEBHOOK')]) {
        def emoji = ''
        def title = ''
        def description = ''
        def color = 0
        def fields = []
        
        def currentTime = sh(script: "date", returnStdout: true).trim()
        
        if (status == 'START') {
            emoji = '🚀'
            title = 'Démarrage du pipeline de déploiement'
            color = 3447003
            fields.add('{"name": "📁 Projet: ' + PROJECT_NAME + '_' + PM2_PORT + '", "value": " ", "inline": false}')
            fields.add('{"name": "🌿 Branche: ' + GIT_BRANCH + '", "value": " ", "inline": false}')
            fields.add('{"name": "🕐 Début: ' + currentTime + '", "value": " ", "inline": false}')
            
        } else if (status == 'BUILD') {
            emoji = '⚙️'
            title = 'Build terminé avec succès'
            color = 3066993
            fields.add('{"name": "📁 ' + PROJECT_NAME + '_' + PM2_PORT + '", "value": " ", "inline": false}')
            
        } else if (status == 'SUCCESS') {
            emoji = '🎉'
            title = 'Déploiement réussi!'
            color = 3066993
            fields.add('{"name": "📁 ' + PROJECT_NAME + '_' + PM2_PORT + '", "value": " ", "inline": false}')
            fields.add('{"name": "🌿 Branche: ' + GIT_BRANCH + '", "value": " ", "inline": false}')
            fields.add('{"name": "✅ En ligne sur port ' + PM2_PORT + '", "value": " ", "inline": false}')
            
        } else if (status == 'FAILURE') {
            emoji = '❌'
            title = 'Déploiement échoué'
            color = 15158332
            fields.add('{"name": "📁 ' + PROJECT_NAME + '_' + PM2_PORT + '", "value": " ", "inline": false}')
        }
        
        def fieldsJson = fields.size() > 0 ? ', "fields": [' + fields.join(', ') + ']' : ''
        
        def payload = """{
            "content": "${emoji} ${title}",
            "embeds": [{
                "title": "${emoji} ${title}",
                "color": ${color}
                ${fieldsJson}
            }]
        }"""
        
        sh '''
            curl -X POST \
                -H 'Content-type: application/json' \
                --data \'''' + payload + '''\' \
                "${DISCORD_WEBHOOK}"
        '''
    }
}
