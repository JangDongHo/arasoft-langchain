from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_community.document_loaders import TextLoader
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import BaseMessage, AIMessage
from langchain_core.pydantic_v1 import BaseModel, Field
from retriever import find_widgets
from typing import List
import streamlit as st
from dotenv import load_dotenv
load_dotenv()

loader = TextLoader('./scripts/example_script.txt', encoding="utf-8")
data = loader.load()
example_script = data[0].page_content

generate_prompt = ChatPromptTemplate(
    [
        (
            "system",
            """
            You are an expert in creating eBook layouts based on the ePub 3.0 standard.

            For the given e-pub script, generate the xhtml layout only using the given widgets docs.
            The size of individual widget elements, defined by left, top, width, and height, should be adjusted to match the page size of 580px by 780px.
            You must refer to the following e-book format and style guide.
            Content included in the e-book must never be created or modified and do not use <br> tag.

            Parameters:
                - epub_script: The script for the e-pub book.
                - style_guide: The style guide for the e-pub book.

            Returns:
                - epub_xhtml: The xhtml layout for the e-pub book.

            Format:
                <?xml version="1.0" encoding="utf-8"?>
                <html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
                <head>
                <title></title>
                <meta http-equiv="default-style" content="application/xhtml+xml; charset=utf-8" />
                <meta name="viewport" content="width=600, height=800" />
                <link href="./nep_css/namo_default.css" rel="stylesheet" type="text/css" />
                <script type="text/javascript" src="./nep_js/jquery.min.js"></script>
                <script type="text/javascript" src="./nep_js/na_editing.js"></script>
                <script type="text/javascript" src="./nep_js/namo_default.js"></script>
                <script type="text/javascript" src="./nep_js/pubtree_diagram_template.js"></script>
                <script type="text/javascript" src="./nep_js/pubtree_animation_template.js"></script>
                </head>
                <body style="margin: 0px; padding: 10px; width: 580px; height: 780px;">
                </body>
                </html>
            """
        ),
        MessagesPlaceholder(variable_name="history"),
        ("human", "#Epub_script:{epub_script}\n#Style_guide:{style_guide}"),
    ]
)

class InMemoryHistory(BaseChatMessageHistory, BaseModel):
    """In memory implementation of chat message history."""

    messages: List[BaseMessage] = Field(default_factory=list)

    def add_messages(self, messages: List[BaseMessage]) -> None:
        """Add a list of messages to the store"""
        self.messages.extend(messages)

    def clear(self) -> None:
        self.messages = []


def select_llm_model(model_name: str, temperature: int, top_p: int):
    if model_name == "Gemini-1.5-pro-latest(무료)":
        return ChatGoogleGenerativeAI(model="gemini-1.5-pro-latest", temperature=temperature, top_p=top_p)
    elif model_name == "GPT-4o mini(유료)":
        return ChatOpenAI(model="gpt-4o-mini", temperature=temperature, top_p=top_p)

def main():
    def get_session_history(session_ids: str) -> BaseChatMessageHistory:
        if session_ids not in store:
            store[session_ids] = InMemoryHistory()
        return store[session_ids]
    
    with st.sidebar:
        with st.expander("전자책 원고 입력"):
            epub_script = st.text_area("원고", value=example_script, height=500, label_visibility="collapsed")
        with st.expander("스타일 가이드 입력"):
            style_guide = st.text_area("스타일 가이드", value="", height=100, label_visibility="collapsed")
        st.subheader("LLM 모델 선택")
        models = ["GPT-4o mini(유료)", "Gemini-1.5-pro-latest(무료)"]
        select_model = st.sidebar.selectbox("", models, index=0, label_visibility="collapsed")
        chunk_size = st.text_input("chunk_size", value=600, help="원고를 분할할 크기입니다.")
        temperature = st.slider('temperature', min_value=0.0, max_value=1.0, value=0.0, step=0.01, help="0.0이면 가장 확실한 답변을, 1.0이면 가장 다양한 답변을 생성합니다.")
        top_p = st.slider('top_p', min_value=0.0, max_value=1.0, value=1.0, step=0.01, help="0.0이면 가장 확실한 답변을, 1.0이면 가장 다양한 답변을 생성합니다.")
        button = st.button("변환")

    if button:
        if epub_script:
            store = {}
            history = get_session_history("abc123")
            history.clear()
            # 1. 문서 구조 분석 및 변환
            with st.spinner('1. 문서 구조 분석 및 변환 중...'):
                text_splitter = RecursiveCharacterTextSplitter(
                    chunk_size=int(chunk_size),
                    chunk_overlap=50,
                    length_function = len,
                    is_separator_regex=False,
                )
                sections = text_splitter.split_text(epub_script)
            with st.spinner('2. 기술 문서 로드 중...'):
                llm = select_llm_model(select_model, temperature, top_p)
                style_guide = "글상자 위젯들을 불러와주세요. 그리고, " + style_guide
                response = find_widgets(llm, style_guide)
                history.add_message(AIMessage(content=response))
            with st.spinner("3. 레이아웃 배치..."):
                chain = generate_prompt | llm | StrOutputParser()
                results = []
                for section in sections:
                    # 생성
                    chain_with_history = RunnableWithMessageHistory(
                        chain,
                        get_session_history,
                        input_messages_key="epub_script",
                        history_messages_key="history",
                    )
                    result = chain_with_history.invoke(
                        {
                            "epub_script": section,
                            "style_guide": style_guide
                        },
                        config={
                            "configurable": {
                                "session_id": "abc123"
                            }
                        }
                    )
                    # 평가
                    
                    st.expander(f"페이지 {len(results)+1}").code(result, language='html')
                    results.append(result)
            with st.expander("사용된 프롬프트"):
                st.write(chain)
            with st.expander("과거 대화 내용"):
                for message in history.messages:
                    st.write(message.content)
            # 탭 생성
            tabs = st.tabs([f"페이지 {i+1}" for i in range(len(results))])
            for i, (tab, body) in enumerate(zip(tabs, results)):
                body = body.replace('\n', '').replace('\n', '').replace("```html", "").replace("```xhtml","").replace("```xml","").replace("```","")
                with tab:
                    st.code(body, language='html')
                    st.write(body, unsafe_allow_html=True)
                
        else:
            st.warning("원고를 입력하세요.")
    else:
        st.info("아라소프트 전자책 레이아웃 생성 서비스입니다. 왼쪽 사이드바에서 원고를 입력하고 변환 버튼을 눌러주세요.")
    
        
        

if __name__ == "__main__":
    main()