from langchain.vectorstores import Chroma
from dotenv import load_dotenv
load_dotenv()

vectorstore = Chroma.from_documents(
    documents=all_splits, 
    embedding=OpenAIEmbeddings()
  )