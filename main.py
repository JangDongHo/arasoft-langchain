from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.llms import Ollama
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_community.document_loaders import TextLoader
from lxml import etree
import streamlit as st
from dotenv import load_dotenv
load_dotenv()

# 위젯 db 열기
loader = TextLoader("dataset/epub_widgets.txt")
docs = loader.load()

head = """
<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
<title></title>
<meta http-equiv="default-style" content="application/xhtml+xml; charset=utf-8" />
<meta name="viewport" content="width=600, height=800" />
<link href="./content/nep_css/namo_default.css" rel="stylesheet" type="text/css" />
<script type="text/javascript" src="./content/nep_js/jquery.min.js"></script>
<script type="text/javascript" src="./content/nep_js/na_editing.js"></script>
<script type="text/javascript" src="./content/nep_js/namo_default.js"></script>
<script type="text/javascript" src="./content/nep_js/pubtree_diagram_template.js"></script>
<script type="text/javascript" src="./content/nep_js/pubtree_animation_template.js"></script>
</head>
"""

agent1 = """
For the given e-pub script, generate the xhtml layout using the given widgets.
You must refer to the following e-book format and output only the appropriate body value.
Content included in the e-book must never be created or modified.

Format:
    {head}
    <body style="margin: 0px; padding: 10px; width: 580px; height: 780px;">
    </body>

Parameters:
    - epub_script: The script for the e-pub book. (default page size: 580px x 780px)
    - style_guide: The style guide for the e-pub book.

Returns:
    - epub_xhtml: The xhtml layout for the e-pub book. (only the body value)

Epub_script:
    {epub_script}

Epub_widgets:
    {epub_widgets}

Style_guide:
    {style_guide}
"""

example_script = """한국의 역사

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
한국은 K-팝, 드라마, 영화 등 현대 문화에서도 큰 영향력을 발휘하고 있습니다. BTS, 블랙핑크와 같은 K-팝 그룹은 전 세계적으로 많은 팬을 보유하고 있으며, 한국 드라마와 영화는 글로벌 시장에서 큰 인기를 얻고 있습니다."""

def validate_xhtml(xhtml_content: str) -> bool:
    try:
        # XHTML 파서 생성
        parser = etree.XMLParser(dtd_validation=True)
        
        # XHTML 문서 파싱 및 무결성 검사
        etree.fromstring(xhtml_content, parser)
        
        return True
    except etree.XMLSyntaxError as e:
        return False

def main():
    pages = []
    with st.sidebar:
        choice = st.sidebar.selectbox('생성된 페이지', pages)
        st.subheader("전자책 원고 입력")
        epub_script = st.text_area("원고", value=example_script[:510], height=500, label_visibility="collapsed")
        st.subheader("스타일 가이드")
        style_guide = st.text_area("스타일 가이드", value="", height=100, label_visibility="collapsed")
        st.subheader("LLM 모델 선택")
        models = ["GPT-4o mini(유료)", "Gemini-1.5-pro-latest(무료)"]
        select_model = st.sidebar.selectbox("", models, index=0, label_visibility="collapsed")
        button = st.button("변환")

    if button:
        if epub_script:
            input = {"head": head, "epub_script": epub_script, "epub_widgets": docs, "style_guide": style_guide}
            with st.spinner('1. 적절한 레이아웃으로 변환 중...'):
                # 언어모델 불러오기
                if select_model == "Gemini-1.5-pro-latest(무료)":
                    llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro-latest", temperature=0)
                elif select_model == "GPT-4o mini(유료)":
                    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
                prompt = PromptTemplate.from_template(agent1)
                output_parser = StrOutputParser()
                chain = prompt | llm | output_parser
                output = chain.invoke(input)
                output = output.replace("```html", "").replace("```xhtml","").replace("```xml","").replace("```","")
                output = f"{head}{output}</html>"
            with st.expander("사용된 프롬프트"):
                st.write(chain)
            with st.expander("전체 코드"):
                st.code(output, language='html')
            st.write(output, unsafe_allow_html=True)
                
        else:
            st.warning("원고를 입력하세요.")
    else:
        st.info("아라소프트 전자책 레이아웃 생성 서비스입니다. 왼쪽 사이드바에서 원고를 입력하고 변환 버튼을 눌러주세요.")
    
        
        

if __name__ == "__main__":
    main()