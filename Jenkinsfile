pipeline {
  agent { label 'ameen-ui' }

  parameters {
    choice(name: 'ENV',     choices: ['dev', 'sit', 'uat', 'e2e'], description: 'Target environment')
    string(name: 'DOMAIN',  defaultValue: '', description: 'Blank = all, or establishment,individual,public')
    string(name: 'GREP',    defaultValue: '', description: 'Optional tag filter, e.g. @smoke')
    string(name: 'WORKERS', defaultValue: '4')
  }

  environment {
    PW_IMAGE     = 'mcr.microsoft.com/playwright:v1.55.0-noble' // point at your internal registry mirror
    NPM_REGISTRY = 'https://nexus.gosi.ins/repository/npm-group/'
    IMAGE        = "playwright-ui-automation:${env.BUILD_NUMBER}"
  }

  options { timestamps(); timeout(time: 90, unit: 'MINUTES') }

  stages {
    stage('Build image') {
      steps {
        sh 'docker build --build-arg PW_IMAGE=$PW_IMAGE --build-arg NPM_REGISTRY=$NPM_REGISTRY -t $IMAGE .'
      }
    }

    stage('Run tests') {
      steps {
        withCredentials([
          usernamePassword(credentialsId: "est-${params.ENV}",  usernameVariable: 'ESTABLISHMENT_USERNAME', passwordVariable: 'ESTABLISHMENT_PASSWORD'),
          usernamePassword(credentialsId: "ind-${params.ENV}",  usernameVariable: 'INDIVIDUAL_USERNAME',    passwordVariable: 'INDIVIDUAL_PASSWORD'),
          usernamePassword(credentialsId: "oracle-${params.ENV}", usernameVariable: 'DB_USER',             passwordVariable: 'DB_PASSWORD'),
          string(credentialsId: "oracle-connect-${params.ENV}", variable: 'DB_CONNECT_STRING'),
        ]) {
          sh '''
            mkdir -p reports
            docker run --rm --ipc=host --init \
              -e CI=true -e HOME=/tmp -e ENV=$ENV -e DOMAIN="$DOMAIN" -e WORKERS=$WORKERS \
              -e ESTABLISHMENT_USERNAME -e ESTABLISHMENT_PASSWORD \
              -e INDIVIDUAL_USERNAME -e INDIVIDUAL_PASSWORD \
              -e DB_USER -e DB_PASSWORD -e DB_CONNECT_STRING \
              -v "$WORKSPACE/reports:/app/reports" \
              --user "$(id -u):$(id -g)" \
              $IMAGE ${GREP:+--grep "$GREP"}
          '''
        }
      }
    }
  }

  post {
    always {
      junit allowEmptyResults: true, testResults: 'reports/junit/results.xml'
      archiveArtifacts allowEmptyArchive: true, artifacts: 'reports/**'
      sh 'docker rmi $IMAGE || true'
    }
  }
}
