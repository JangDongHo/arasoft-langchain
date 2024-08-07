from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
import streamlit as st
from dotenv import load_dotenv
load_dotenv()

template = """
당신은 전자책 pdf 원고를 보고 적절한 디자인을 가진 xhtml 파일로 만들어주는 프로그램입니다. 다음 원고를 보고 xhtml로 전자책 문서를 출력하세요.

INPUT:
{epub_script}

OUTPUT:
xhtml
"""

def main():
  st.header("아라소프트 전자책 AI")

  menu = ['PDF To Epub']
  choice = st.sidebar.selectbox('메뉴', menu)

  if choice == 'PDF To Epub':
      st.subheader("전자책 원고 입력")
      
      epub_script = st.text_area("원고를 여기에 입력하세요", height=300)
      
      if st.button("변환"):
          if epub_script:
              input = {"epub_script": epub_script}
              with st.spinner('변환 중...'):
                  # 언어모델 불러오기
                  llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro-latest")
                  prompt = PromptTemplate.from_template(template)
                  output_parser = StrOutputParser()
                  chain = prompt | llm | output_parser
                  xhtml_output = chain.invoke(input)
              st.success("변환 완료!")
              st.code(xhtml_output, language='html')
          else:
              st.warning("원고를 입력하세요.")

if __name__ == "__main__":
    main()