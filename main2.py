from bs4 import BeautifulSoup
import json
from query import load_categories, insert_category, get_max_index

# 로드 카테고리
tag_category, class_category = load_categories()

# 카테고리 매핑 함수
def get_category(tag):
    global tag_category, class_category
    tag_name = tag.name
    category = tag_category.get(tag_name, 0)  # 태그에 따른 카테고리
    if category == 0:
        max_index = get_max_index('tag')
        category = max_index + 1
        insert_category('tag', tag_name, category)
        tag_category, class_category = load_categories()

    if tag.has_attr('class'):
        for cls in tag['class']:
            category = max(category, class_category.get(cls, 0))  # 클래스에 따른 카테고리
            if category == 0:
                max_index = get_max_index('class')
                category = max_index + 1
                insert_category('class', cls, category)
                tag_category, class_category = load_categories()

    return category

def html_to_category_tree(body_content):
    def traverse(node):
        if node.name:
            category = get_category(node)  # node 객체를 인자로 전달하여 카테고리 값을 얻습니다
            attributes = node.attrs
            content = node.string if node.string else ''
            children = [traverse(child) for child in node.children if child.name]
            return {'category': category, 'attributes': attributes, 'content': content, 'children': children}
        return None
    
    return traverse(body_content)

def category_tree_to_html(tree):
    global tag_category, class_category

    def create_tag(soup, node):
        # 카테고리로부터 태그 이름을 찾는다
        tag_name = next((k for k, v in tag_category.items() if v == node['category']), None)
        if tag_name is None:
            print(f"Warning: No tag name found for category {node['category']}")
            return None

        # 새로운 태그를 생성한다
        tag = soup.new_tag(tag_name)
        
        # 속성과 스타일을 추가한다
        for attr, value in node['attributes'].items():
            if isinstance(value, list):
                tag[attr] = ' '.join(value)  # class 속성 같은 경우 여러 값을 가질 수 있다
            else:
                tag[attr] = value

        # 텍스트 내용을 추가한다
        if node['content']:
            tag.string = node['content']
        
        # 자식 노드들을 재귀적으로 추가한다
        for child in node['children']:
            child_tag = create_tag(soup, child)
            if child_tag:
                tag.append(child_tag)
        
        return tag

    # 새로운 HTML 문서 객체를 생성한다
    soup = BeautifulSoup('<html></html>', 'html.parser')
    body = soup.new_tag('body')
    soup.html.append(body)

    # 루트 노드들을 body에 추가한다
    for child in tree['children']:
        child_tag = create_tag(soup, child)
        if child_tag:
            body.append(child_tag)

    return soup

# 파일에서 XHTML 내용을 읽어옵니다.
file_path = 'test.xhtml'
with open(file_path, 'r', encoding='utf-8') as file:
    xhtml_content = file.read()

soup = BeautifulSoup(xhtml_content, 'html.parser')
body_content = soup.body

category_tree = html_to_category_tree(body_content)
#print(json.dumps(category_tree, indent=2, ensure_ascii=False))

# HTML로 복원
restored_html = category_tree_to_html(category_tree)
print(restored_html.prettify())
