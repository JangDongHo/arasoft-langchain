from langchain import hub
from langchain_text_splitters import MarkdownHeaderTextSplitter, HTMLHeaderTextSplitter
from langchain_community.document_loaders import TextLoader
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain.docstore.document import Document
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_teddynote import logging
from bs4 import BeautifulSoup
from io import StringIO
from dotenv import load_dotenv
load_dotenv()

logging.langsmith("아라소프트")

# 단계 1: 문서 로드(Load Documents)
loader = TextLoader("./dataset/epub_widgets.txt", encoding="utf-8")
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
widget_doc = markdown_splitter.split_text(docs[0].page_content)


epub_doc = []
file_names = ['test', 'test2', 'test3']

for file_name in file_names:
    loader = TextLoader(f"./dataset/{file_name}.xhtml", encoding="utf-8")
    docs = loader.load()

    # Create a BeautifulSoup object with recursive=False
    soup = BeautifulSoup(docs[0].page_content, 'html.parser')
    body = soup.find('body')

    if body:
        for idx, element in enumerate(body.find_all(recursive=False)):
            metadata = {
                'element_type': element.name,
                'attributes': element.attrs,
                'id': element.get('id', ''),
                'class': element.get('class', []),
                'text_content': element.get_text(strip=True),
                'parent_element': element.find_parent().name if element.find_parent() else None,
                'position': idx,
                'document_location': f'document_{idx}'
            }
            epub_doc.append(Document(metadata=metadata, page_content=str(element)))


# 단계 3: 임베딩 & 벡터스토어 생성(Create Vectorstore)
# 벡터스토어를 생성합니다.
embedding_model = GoogleGenerativeAIEmbeddings(model='models/embedding-001')
vectorstore = FAISS.from_documents(documents=widget_doc+epub_doc, embedding=embedding_model)

# 단계 4: 검색(Search)
# 기술 문서에 포함되어 있는 정보를 검색하고 생성합니다.
retriever = vectorstore.as_retriever()

# 단계 5: 프롬프트 생성(Create Prompt)
# 프롬프트를 생성합니다.
prompt = hub.pull("rlm/rag-prompt")

# 단계 6: 언어모델 생성(Create LLM)
# 모델(LLM) 을 생성합니다.

# 단계 7: 체인 생성(Create Chain)
def format_docs(docs):
    # 검색한 문서 결과를 하나의 문단으로 합쳐줍니다.
    print("\n\n".join(doc.page_content for doc in docs))
    return "\n\n".join(doc.page_content for doc in docs)

# 단계 8: 체인 실행(Run Chain)
# 문서에 대한 질의를 입력하고, 답변을 출력합니다.
# JSON 스키마 정의
json_schema = """
{
    "properties": {
        "widgets": {
            "type": "array",
            "items": {
                "properties": {
                    "widget_name": {
                        "type": "string"
                    },
                    "widget_description": {
                        "type": "string"
                    },
                    "example_codes": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        }
                    },
                },
                "required": [
                    "widget_name",
                    "widget_description",
                    "example_codes"
                ]
            }
        }
    }
}
"""


# 템플릿 질문 정의
question_template = """
Please bring the names, descriptions, and xhtml code of the widgets related to the following sentence.

Epub_Script:
{epub_script}

Sententce:
{style_guide}

The output should be formatted as a JSON instance that conforms to the JSON schema below.

Here is the output schema:
```
{json_schema}
```
"""

def find_widgets(llm, epub_script:str, style_guide: str):
    question = question_template.format(epub_script=epub_script, style_guide=style_guide, json_schema=json_schema)
    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )
    return rag_chain.invoke(question)