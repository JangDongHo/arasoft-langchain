# 아라소프트 산학협력과제 랭체인

이 프로젝트는 아라소프트 산학협력과제 랭체인을(를) 위한 Python 애플리케이션입니다. 이 가이드에서는 개발 환경 설정 방법, 필요한 패키지 설치 방법, 애플리케이션 실행 방법을 설명합니다.

## 요구 사항

- Python 3.10.12

## 1. 개발 환경 설정

먼저, 이 저장소를 로컬 머신에 클론합니다.

```sh
git clone https://github.com/사용자명/저장소명.git
cd 저장소명
```

## 2. 가상 환경 설정

Python 가상 환경을 설정하여 프로젝트의 종속성을 관리합니다.

```sh
python3 -m venv venv
source venv/bin/activate # Unix/macOS
venv\Scripts\activate # Windows
```

## 3. 필요한 패키지 설치

`requirements.txt` 파일을 사용하여 필요한 Python 패키지를 설치합니다.

```sh
pip install -r requirements.txt
```

## 4. 환경 변수 설정

애플리케이션 실행에 필요한 환경 변수를 설정합니다. .env 파일을 사용하여 환경 변수를 관리할 수 있습니다. 프로젝트 루트 디렉토리에 .env 파일을 생성하고, 필요한 환경 변수를 정의합니다.

```sh
touch .env
```

.env 파일 예시:

```
API_KEY=your_api_key_here
DATABASE_URL=your_database_url_here
SECRET_KEY=your_secret_key_here
```

## 5. 애플리케이션 실행

Streamlit을 사용하여 애플리케이션을 실행합니다.

```
streamlit run main.py
```
