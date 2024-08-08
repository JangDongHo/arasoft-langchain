# Data Loader - 웹페이지 데이터 가져오기
from langchain_community.document_loaders import WebBaseLoader

url = 'https://docs.google.com/document/d/1gNjhoJyBp-jO9AhyqpVaoUC4iD2ITyJg_F3-j6RsUsA/edit'
loader = WebBaseLoader(url)

docs = loader.load()

print(docs[0].page_content)