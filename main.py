from dotenv import load_dotenv
from langchain_teddynote import logging
from langchain_openai import ChatOpenAI
from langchain.chains.openai_functions import create_structured_output_runnable
from typing import List
import re

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.pydantic_v1 import BaseModel, Field
from lxml import etree

load_dotenv()
logging.langsmith("아라소프트")

def body_parser(tree):
    # XHTML 네임스페이스를 정의합니다.
    namespaces = {
        'xhtml': 'http://www.w3.org/1999/xhtml'
    }

    # <body> 태그를 찾습니다.
    body = tree.find('xhtml:body', namespaces)

    # <body> 태그의 내용을 출력합니다.
    if body is not None:
        # Pretty print로 포맷팅
        return etree.tostring(body, encoding='unicode', method='html')
    else:
        return ""

class Category(BaseModel):
    """ HTML 코드를 정수형 카테고리로 변환합니다. """

    answer: List[str] = Field(..., description="HTML 코드를 정수형 카테고리로 변환합니다.")

# test.xhtml 파일을 읽어와서 파싱합니다.
tree = etree.parse('test.xhtml')
body_content = body_parser(tree)

# 객체 생성
llm = ChatOpenAI(
    temperature=0,  # 창의성 (0.0 ~ 2.0)
    model_name="gpt-4o-mini",  # 모델명
)

# Define the prompt
prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "당신은 전자책 HTML 코드를 정수형 카테고리로 변환하는 프로그램입니다.",
        ),
        (
            "human",
            """대부분의 전자책은 Tag와 Class를 사용하여 구조화되어 있습니다. 이 정보를 사용하여 카테고리로 변환할 수 있습니다.
            예를 들어, <div class="nac_textbox_center">...</div> 는 1로 변환됩니다.
            기존에 발견하지 못한 새로운 Tag나 Class가 있을 경우, 이를 추가할 수 있습니다. 

            출력 예시:
            1
              2
                3
                3
                3
              4
              5

            body: {body}
            """,
        )
    ]
)

chain = prompt | llm

#response = chain.invoke({"body": body_content})

print(body_content)

# Print response
#print(response)
