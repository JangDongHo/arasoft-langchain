from bs4 import BeautifulSoup
import json

tag_to_category = {
    'body': 1,
    'div': 2,
    'p': 3,
    'span': 4,
    'img': 5,
    'a': 6,
}

def html_to_category_tree(body_content):
    def traverse(node):
        if node.name:
            category = tag_to_category.get(node.name, 0)
            attributes = node.attrs
            content = node.string if node.string else ''
            children = [traverse(child) for child in node.children if child.name]
            return {'category': category, 'attributes': attributes, 'content': content, 'children': children}
        return None
    
    return traverse(body_content)

def category_tree_to_html(tree):
    def create_tag(soup, node):
        if node['category'] == 0:
            return None
        tag_name = [k for k, v in tag_to_category.items() if v == node['category']][0]
        tag = soup.new_tag(tag_name)
        for attr, value in node['attributes'].items():
            tag[attr] = value
        if node['content']:
            tag.string = node['content']
        for child in node['children']:
            tag.append(create_tag(soup, child))
        return tag

    soup = BeautifulSoup('<html></html>', 'html.parser')
    body = soup.new_tag('body')
    soup.html.append(body)

    for child in tree['children']:
        body.append(create_tag(soup, child))

    return soup


# 파일에서 XHTML 내용을 읽어옵니다.
file_path = 'test.xhtml'
with open(file_path, 'r', encoding='utf-8') as file:
    xhtml_content = file.read()

soup = BeautifulSoup(xhtml_content, 'html.parser')
body_content = soup.body

category_tree = html_to_category_tree(body_content)
print(json.dumps(category_tree, indent=2, ensure_ascii=False))

# HTML로 복원
restored_html = category_tree_to_html(category_tree)
#print(restored_html.prettify())