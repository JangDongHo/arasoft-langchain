from langchain.text_splitter import RecursiveCharacterTextSplitter
from bs4 import BeautifulSoup
from langchain_community.document_loaders import TextLoader
from langchain.docstore.document import Document
import glob

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=5000, chunk_overlap=1000
)

epub_docs = []

files = sorted(glob.glob("./dataset/2023년_지역특화산업_이야기/*.xhtml"))

for file in files:
    loader = TextLoader(file, encoding="utf-8")
    docs = loader.load()

    soup = BeautifulSoup(docs[0].page_content, 'html.parser')
    body = soup.find('body')

    if body:
        for idx, element in enumerate(body.find_all(recursive=False)):
            # Get the direct children of the current element
            children = []
            for child in element.find_all(recursive=False):
                child_data = {
                    'element_type': child.name,
                    'attributes': child.attrs,
                    #'text': child.get_text(strip=True),  # Optional: Extract text content from children
                }
                children.append(child_data)

            metadata = {
                'element_type': element.name,
                'attributes': element.attrs,
                'children': children,  # Include children with their metadata
            }

            # Add the metadata and content to split_docs
            epub_docs.append(Document(metadata=metadata, page_content=str(metadata)))