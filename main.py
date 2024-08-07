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

example_script = """
한국의 역사

1. 고대 한국

고조선
고조선은 기원전 2333년에 단군 왕검이 세운 것으로 전해지는 한국 최초의 국가입니다. 단군 신화에 따르면, 단군은 하늘의 신 환웅과 곰이 변한 인간인 웅녀 사이에서 태어났다고 합니다.

삼국 시대
삼국 시대는 고구려, 백제, 신라 세 나라가 한반도에서 서로 경쟁하던 시기입니다. 고구려는 북쪽, 백제는 서쪽, 신라는 동쪽에 위치해 있었습니다. 세 나라는 서로 전쟁을 벌이며 영토를 확장하고 문화를 발전시켰습니다.

2. 중세 한국

고려
고려는 918년에 왕건이 세운 국가로, 한반도를 통일한 왕조입니다. 고려는 불교를 국가의 중심 사상으로 삼았으며, 금속 활자와 청자와 같은 문화적 유산을 남겼습니다.

조선
조선은 1392년에 이성계가 세운 왕조로, 유교를 국가의 중심 이념으로 삼았습니다. 조선은 한글을 창제하고, 과학과 예술에서 큰 발전을 이루었습니다. 세종대왕은 한글을 창제하여 백성들이 쉽게 글을 배울 수 있도록 하였고, 장영실은 과학 기술을 발전시켰습니다.

3. 근대 한국

개화기와 일제 강점기
19세기 말, 조선은 개화기를 맞이하며 서구 문물을 받아들이기 시작했습니다. 그러나 1910년부터 1945년까지 일본의 식민 지배를 받으면서 많은 고통을 겪었습니다. 이 시기 동안 한국인들은 독립운동을 전개하여 나라를 되찾기 위해 싸웠습니다.

광복과 대한민국
1945년, 한국은 일본으로부터 해방되었고, 1948년에 대한민국 정부가 수립되었습니다. 한국 전쟁 이후 대한민국은 빠르게 경제 발전을 이루며 민주화를 실현하였습니다. 오늘날 한국은 전 세계에서 경제, 문화, 기술 등 다양한 분야에서 큰 영향을 미치는 나라로 성장하였습니다.

4. 한국의 문화

한글
한글은 세종대왕이 창제한 한국의 고유 문자입니다. 한글은 간단한 구조와 과학적인 원리로 인해 배우기 쉽고 쓰기 편리하여, 한국의 문화와 언어를 보존하는 중요한 역할을 하고 있습니다.

전통 음식
한국의 전통 음식에는 김치, 불고기, 비빔밥 등이 있습니다. 김치는 발효된 채소로 만든 음식으로, 건강에 좋은 유산균이 많이 들어 있습니다. 불고기는 얇게 썬 고기를 양념에 재워 구운 음식이며, 비빔밥은 여러 가지 나물과 고기를 밥 위에 올리고 고추장과 함께 비벼 먹는 음식입니다.

현대 문화
한국은 K-팝, 드라마, 영화 등 현대 문화에서도 큰 영향력을 발휘하고 있습니다. BTS, 블랙핑크와 같은 K-팝 그룹은 전 세계적으로 많은 팬을 보유하고 있으며, 한국 드라마와 영화는 글로벌 시장에서 큰 인기를 얻고 있습니다.
"""


def main():
  st.header("아라소프트 전자책 AI")

  menu = ['PDF To Epub']
  choice = st.sidebar.selectbox('메뉴', menu)

  if choice == 'PDF To Epub':
      st.subheader("전자책 원고 입력")
      
      epub_script = st.text_area("원고를 여기에 입력하세요", value=example_script, height=300)
      
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
                  xhtml_output = xhtml_output.replace('```xhtml\n', '').replace('\n```', '')
              st.success("변환 완료!")
              st.code(xhtml_output, language='html')
              st.markdown(xhtml_output, unsafe_allow_html=True)
          else:
              st.warning("원고를 입력하세요.")

if __name__ == "__main__":
    main()