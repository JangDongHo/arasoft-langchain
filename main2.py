import re
import pandas as pd
from bs4 import BeautifulSoup

def parse_styles(style):
    styles = {}
    if style:
        for item in style.split(';'):
            if ':' in item:
                key, value = item.split(':')
                styles[key.strip()] = value.strip()
    return styles

def extract_numeric_value(value):
    match = re.search(r'(\d+)', value)
    return match.group(1) if match else '0'

def styles_to_string(styles):
    return '; '.join(f'{key}: {value}' for key, value in styles.items())

def dfs(node, parent_idx):
    global node_idx
    current_idx = node_idx
    node_idx += 1

    # 태그, 클래스, 속성 추출
    tag = node.name if node.name else ""
    classes = node.get('class', [])
    attrs = {k: v for k, v in node.attrs.items() if k != 'class'}
    contents = ''.join(node.find_all(text=True, recursive=False)).strip()

    # 노드 좌표 추출
    styles = parse_styles(attrs.get('style', ''))

    coordinate = [
        extract_numeric_value(styles.get('left', '0')),
        extract_numeric_value(styles.get('top', '0')),
        extract_numeric_value(styles.get('width', '0')),
        extract_numeric_value(styles.get('height', '0')),
    ]

    # 제거할 스타일 속성
    if 'position' in styles and styles['position'] == 'absolute':
        styles.pop('left', None)
        styles.pop('top', None)
        styles.pop('width', None)
        styles.pop('height', None)
        styles.pop('position', None)

    # 업데이트된 스타일 속성을 attrs에 다시 적용
    if styles:
        attrs['style'] = styles_to_string(styles)
    else:
        attrs.pop('style', None)

    p_i = parent_idx

    nodes.append([current_idx, tag, classes, contents, p_i, coordinate, attrs])

    # 자식 노드에 대해 재귀 호출
    for child in node.children:
        if child.name:  # 태그 노드만 탐색
            dfs(child, current_idx)

file = './dataset/test2.xhtml'
with open(file, 'r', encoding='utf-8') as f:
    html = f.read()

# 노드 정보를 저장할 리스트
nodes = []
node_idx = 1

soup = BeautifulSoup(html, 'lxml')
content = soup.find('body')

# DFS 탐색 시작 (body 태그를 루트로 설정)
dfs(soup.body, 'dummy')

# 결과 출력
df = pd.DataFrame(nodes, columns=['node_idx', 'tag', 'classes', 'contents', 'p_i', 'coordinate', 'attrs'])
print(df)

# 저장
df.to_csv('test2.csv', index=False, encoding="utf-8-sig")