from bs4 import BeautifulSoup
from niteru.similarity import similarity
from niteru.structural_similarity import structural_similarity
from niteru.style_similarity import style_similarity
from difflib import SequenceMatcher
import re

# HTML 파일 불러오기
def load_html_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        return file.read()

# 테스트 HTML 파일 비교
html_file_1 = load_html_file('./dataset/evals/original.html')
html_file_2 = load_html_file('./dataset/evals/generate.html')

# 유사도 계산
style_similarity = style_similarity(html_file_1, html_file_2)
structural_similarity = structural_similarity(html_file_1, html_file_2)
similarity = similarity(html_file_1, html_file_2, k=0.3)

print(f'스타일 유사도: {style_similarity * 100:.2f}%')
print(f'구조 유사도: {structural_similarity * 100:.2f}%')
print(f'종합 유사도: {similarity * 100:.2f}%')

# HTML 텍스트 추출 함수
def extract_text_from_html(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    # 텍스트만 추출하고 불필요한 공백을 제거
    text = soup.get_text()
    # 여러 개의 공백을 하나로, 앞뒤 공백을 제거
    cleaned_text = re.sub(r'\s+', ' ', text).strip()
    return cleaned_text

# 두 HTML 텍스트 간의 유사도 비교 함수
def compare_html_similarity(html1, html2):
    text1 = extract_text_from_html(html1)
    text2 = extract_text_from_html(html2)
    
    # difflib.SequenceMatcher를 사용하여 두 텍스트의 유사도 비교
    similarity_ratio = SequenceMatcher(None, text1, text2).ratio()
    
    return similarity_ratio

# 텍스트 추출
html_text_1 = extract_text_from_html(html_file_1)
html_text_2 = extract_text_from_html(html_file_2)

# 텍스트 유사도 비교
text_similarity = compare_html_similarity(html_text_1, html_text_2)

print(f'원고 유사도: {text_similarity * 100:.2f}%')
