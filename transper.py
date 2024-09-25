import pandas as pd
import html
import json
import re

def csv_to_jsonl(csv_file, jsonl_file):
    def replace_quotes(text):
      return text.replace('"', "'")

    def remove_extra_spaces(html_content):
        return re.sub(r'\s+', ' ', html_content.strip())
      
    df = pd.read_csv(csv_file, encoding='utf-8')
    
    df = df.applymap(lambda x: html.unescape(x) if isinstance(x, str) else x)

    with open(jsonl_file, 'w', encoding='utf-8') as f:
        for index, row in df.iterrows():
            system = f"The title of the e-book you need to create is {row['책_제목']}, and the category is {row['대분류_카테고리']}-{row['중분류_카테고리']}. The content of the manuscript that will be included on the page is as follows."
            user = row['원고_텍스트']
            assistant = remove_extra_spaces(row['HTML'])
            
            # JSON 형식으로 저장
            json_line = {
              "messages": [
                {
                  "role": "system",
                  "content": system
                },
                {
                  "role": "user",
                  "content": user
                },
                {
                  "role": "assistant",
                  "content": assistant
                }
              ]
            }
            
            # JSON 객체 유효성 검사
            try:
                json_str = json.dumps(json_line, ensure_ascii=False)
                f.write(json_str + '\n')
            except (TypeError, ValueError) as e:
                print(f"Error at index {index}: {e}")
                print(f"Invalid JSON object: {json_line}")

# 사용 예시
csv_file = 'input.csv'
jsonl_file = 'output.jsonl'

csv_to_jsonl(csv_file, jsonl_file)
