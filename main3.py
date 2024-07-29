from bs4 import BeautifulSoup

class NodeCategory:
    TAG = 1
    CLASS = 2
    ID = 3
    ATTRIBUTE = 4
    UNKNOWN = -1

def get_node_category(tag):
    if tag.name:
        return NodeCategory.TAG
    if tag.get('class'):
        return NodeCategory.CLASS
    if tag.get('id'):
        return NodeCategory.ID
    if isinstance(tag, str):
        return NodeCategory.ATTRIBUTE
    return NodeCategory.UNKNOWN

def get_category_from_number(category_number):
    categories = {
        NodeCategory.TAG: "TAG",
        NodeCategory.CLASS: "CLASS",
        NodeCategory.ID: "ID",
        NodeCategory.ATTRIBUTE: "ATTRIBUTE"
    }
    return categories.get(category_number, "UNKNOWN_CATEGORY")

# 파일에서 XHTML 내용을 읽어옵니다.
file_path = 'test.xhtml'
with open(file_path, 'r', encoding='utf-8') as file:
    xhtml_content = file.read()

soup = BeautifulSoup(xhtml_content, 'xml')
body_content = soup.body

# 모든 태그를 가져와서 카테고리를 매핑하고 출력
for tag in soup.find_all(True):  # 모든 태그 선택
    category_number = get_node_category(tag)
    category_name = get_category_from_number(category_number)
    print(f"Tag: {tag.name}, Category Number: {category_number}, Category Name: {category_name}")

# 특정 태그의 카테고리를 확인
specific_tag = soup.find('div', {'class': 'nac_textbox_center'})
specific_category_number = get_node_category(specific_tag)
specific_category_name = get_category_from_number(specific_category_number)
print(f"\nSpecific Tag: {specific_tag.name}, Category Number: {specific_category_number}, Category Name: {specific_category_name}")