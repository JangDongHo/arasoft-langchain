from openai import OpenAI
import dotenv
import os

dotenv_path = dotenv.find_dotenv()
APIKEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=APIKEY)

# 1. 데이터셋 업로드
res = client.files.create(
  file=open("output2.jsonl", "rb"),
  purpose="fine-tune"
)  # 내 데이터셋 을 openai 내 계정에 업로드

resId = res.id
print(f"trained file id : {resId}")

# 2. 파인튜닝 진행
response = client.fine_tuning.jobs.create(
  training_file=resId,  # 업로드된 나의 데이터셋을 아이디로 찾아 파인튜닝진행
  model="ft:gpt-4o-mini-2024-07-18:personal:arasoft-layout:AAu2m2Yh", 
  hyperparameters={
    "n_epochs": 4,
    "batch_size": 1
  }
)