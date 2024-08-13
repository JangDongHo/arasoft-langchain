from langchain import hub
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_text_splitters import RecursiveCharacterTextSplitter, CharacterTextSplitter, MarkdownHeaderTextSplitter
from langchain_community.document_loaders import TextLoader
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_teddynote import logging
from dotenv import load_dotenv
load_dotenv()

logging.langsmith("아라소프트")

# 단계 1: 문서 로드(Load Documents)
loader = TextLoader("dataset/epub_widgets.txt")
docs = loader.load()

# 단계 2: 문서 분할(Split Documents)
headers_to_split_on = [  # 문서를 분할할 헤더 레벨과 해당 레벨의 이름을 정의합니다.
    (
        "#",
        "Header 1",
    ),  # 헤더 레벨 1은 '#'로 표시되며, 'Header 1'이라는 이름을 가집니다.
    (
        "##",
        "Header 2",
    ),  # 헤더 레벨 2는 '##'로 표시되며, 'Header 2'라는 이름을 가집니다.
]
markdown_splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on)
# markdown_document를 헤더를 기준으로 분할하여 md_header_splits에 저장합니다.
splits = markdown_splitter.split_text(docs[0].page_content)

# 단계 3: 임베딩 & 벡터스토어 생성(Create Vectorstore)
# 벡터스토어를 생성합니다.
embedding_model = GoogleGenerativeAIEmbeddings(model='models/embedding-001')
vectorstore = FAISS.from_documents(documents=splits, embedding=embedding_model)

# 단계 4: 검색(Search)
# 기술 문서에 포함되어 있는 정보를 검색하고 생성합니다.
retriever = vectorstore.as_retriever()

# 단계 5: 프롬프트 생성(Create Prompt)
# 프롬프트를 생성합니다.
prompt = hub.pull("rlm/rag-prompt")

# 단계 6: 언어모델 생성(Create LLM)
# 모델(LLM) 을 생성합니다.
llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro-latest", temperature=0)

def format_docs(docs):
    # 검색한 문서 결과를 하나의 문단으로 합쳐줍니다.
    print(docs)
    return "\n\n".join(doc.page_content for doc in docs)

# 단계 7: 체인 생성(Create Chain)
rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

# 단계 8: 체인 실행(Run Chain)
# 문서에 대한 질의를 입력하고, 답변을 출력합니다.
question = """
다음 위젯들의 이름과 xhtml 코드를 빠짐없이 가져오세요.
위젯 카테고리 안에 여러 가지 위젯이 있는 경우 제일 상위 카테고리의 위젯만 가져오세요.
코드가 포함되어 있지 않다고 생각되는 경우 '코드 없음'이라고 작성해주세요.

- 글상자(가운데 맞춤), 그림
"""
response = rag_chain.invoke(question)

# 결과 출력
print(f"문서의 수: {len(docs)}")
print("===" * 20)
print(f"[HUMAN]\n{question}\n")
print(f"[AI]\n{response}")