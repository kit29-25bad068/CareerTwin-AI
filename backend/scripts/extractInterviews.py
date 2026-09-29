import os, sys, re, json, zipfile, xml.etree.ElementTree as ET

sys.stdout.reconfigure(encoding='utf-8')

VALID_CATEGORIES = [
    'introduction', 'resume', 'project', 'dsa', 'programming', 'oop',
    'dbms', 'operatingSystems', 'computerNetworks', 'systemDesign',
    'behavioral', 'hr', 'problemSolving', 'testing', 'debugging',
    'performance', 'scalability', 'other'
]

def categorize_question(q):
    ql = q.lower().strip()
    
    # 1. Introduction
    if any(k in ql for k in ['tell me about yourself', 'walk me through your introduction', 'introduce yourself']):
        return 'introduction'
        
    # 2. Resume
    if any(k in ql for k in ['walk me through your resume', 'walk through your cv', 'about your resume', 'not on your resume']):
        return 'resume'
        
    # 3. HR
    if any(k in ql for k in [
        'why google', 'why amazon', 'why microsoft', 'why zoho', 'why apple', 'why meta', 
        'why infosys', 'why tcs', 'why adobe', 'why atlassian', 'why do you want to work at a startup', 
        'why do you want to join our company', 'why should we hire you', 'salary expectations', 
        'career goals', 'where do you see yourself in five years', 'questions for us', 'plan to stay', 
        'kind of work are you interested in', 'interests you about this role', 'what do you know about tcs',
        'what do you know about our product', 'what do you know about adobe', 'what makes you interested in working at apple',
        'what interests you about the team or role', 'why do you want to join', 'if you had six months to learn something new',
        'if you joined us tomorrow', 'what motivates you', 'are you willing to relocate', 'what are your strengths and weaknesses',
        'how do you handle work-life balance', 'where do you see yourself', 'comfortable relocating',
        'comfortable working with different technologies', 'how do you keep learning new technologies', 'what do you know about infosys'
    ]):
        return 'hr'

    # 4. Debugging
    if any(k in ql for k in [
        'approach debugging', 'debugging', 'how do you debug', 'how did you debug', 
        'production issue you handled', 'production incident', 'triage a bug', 'heap dump', 
        'thread dump', 'diagnose a memory leak', 'troubleshoot', 'debug your solution'
    ]):
        return 'debugging'

    # 5. Testing
    if any(k in ql for k in [
        'how would you test', 'edge cases', 'invalid input', 'test your code', 'test your solution',
        'unit test', 'integration test', 'mocking', 'what happens with invalid input', 'what happens with a very large input',
        'ensure the quality of your code', 'code review'
    ]):
        return 'testing'

    # 6. Behavioral
    if any(k in ql for k in [
        'tell me about a time', 'tell me about a situation', 'tell me about a mistake', 'tell me about a failure', 
        'disagreed with your', 'worked under pressure', 'took ownership', 'showed leadership', 'helped a teammate', 
        'received negative feedback', 'received feedback', 'quick decision', 'went beyond your responsibility', 
        'handle conflict', 'difficult problem you solved', 'handle pressure', 'worked under ambiguity',
        'influenced someone without authority', 'delivered something under a tight deadline', 
        'delivered a project with a tight deadline', 'tell me about a technical decision', 
        'difficult technical problem', 'wrong technical decision', 'conflict between two teammates',
        'learned something new quickly', 'explain a technical decision you made and its trade-offs',
        'time you made a wrong technical decision', 'difficult teammate situation', 'prioritize when multiple tasks',
        'handled a difficult technical problem'
    ]):
        return 'behavioral'

    # 7. Scalability
    if any(k in ql for k in [
        'scale your system', 'scalable', 'millions of users', 'horizontal scaling', 'load balancing',
        'high availability', 'sharding', 'partitioning', 'handle system failures', 'handle failures',
        'microservices', 'kafka', 'rabbitmq'
    ]):
        return 'scalability'

    # 8. Performance & Optimization
    if any(k in ql for k in [
        'reduce latency', 'improve system performance', 'caching', 'database bottlenecks', 'latency', 
        'optimize your solution', 'time complexity', 'space complexity', 'without extra space', 'in-place',
        'reduce the time complexity', 'reduce the space complexity', 'optimize your coding solution',
        'throughput', 'bottleneck', 'how would you optimize', 'improve application performance'
    ]):
        return 'performance'

    # 9. Project
    if any(k in ql for k in [
        'your project', 'recent project', 'important project', 'academic project', 'final-year project', 
        'contribution to the project', 'challenge in your project', 'improve in your project', 
        'project architecture', "project's architecture", 'routing works in your project', 
        'session management work', 'problem does your project solve', 'classes/modules you would create for the application',
        'why did you choose this technology', 'why did you choose that technology', 'why did you choose your database',
        'why did you choose those technologies', 'how did you solve that challenge', 'what was your contribution', 
        'what was your role in the project', 'which technologies did you use in your project', 'what technologies did you use', 
        'biggest challenge in your project', 'what was the biggest technical challenge you faced', 'what was the biggest challenge',
        'what would you improve in your project'
    ]):
        return 'project'

    # 10. System Design
    if ql.startswith('design ') or any(k in ql for k in [
        'design a ', 'system design', 'design apple push', 'design an ', 'how would you design',
        'high level design', 'low level design', 'architecture of a', 'url shortener', 'notification system',
        'chat application', 'e-commerce system', 'food delivery system', 'rate limiter', 'cache system',
        'file storage system', 'distributed system', 'how would you make your design modular',
        'how would you extend your application with a new feature', 'design a modular', 'data consistency',
        'protect user privacy in your design', 'complex system you designed or improved'
    ]):
        return 'systemDesign'

    # 11. Problem Solving & Aptitude
    if any(k in ql for k in [
        'aptitude problem', 'logical reasoning', 'puzzle', 'equilibrium index', 'queen can move', 
        'spiral fibonacci', 'can you solve it using another approach', 'explain your approach before coding',
        'word ladder', 'wildcard pattern matching', 'job sequencing', 'decode a nested string'
    ]):
        return 'problemSolving'

    # 12. Operating Systems
    if any(k in ql for k in [
        'process and thread', 'process vs thread', 'multithreading', 'deadlock', 'concurrency', 
        'producer-consumer', 'synchronization', 'mutual exclusion', 'synchronized keyword', 
        'volatile keyword', 'operating system', 'round robin', 'semaphore', 'mutex', 'paging', 
        'virtual memory', 'critical section', 'context switching', 'thrashing', 'cpu scheduling',
        'race condition', 'memory management', 'banker', 'kernel', 'monolithic kernel', 'what is a thread'
    ]):
        return 'operatingSystems'

    # 13. Computer Networks
    if any(k in ql for k in [
        'tcp vs udp', 'url in a browser', 'rest api', 'http vs https', 'dns', 'network', 'socket',
        'osi model', 'three-way handshake', 'ip address', 'subnetting', 'port', 'router vs switch',
        'websocket', 'cors', 'ssl/tls', 'tcp/ip', 'ipv4', 'ipv6', 'http', 'https'
    ]):
        return 'computerNetworks'

    # 14. DBMS
    if any(k in ql for k in [
        'dbms', 'sql vs nosql', 'sql or nosql', 'normalization', 'indexing', 'primary key', 'foreign key', 
        'join', 'database indexing', 'sql query', 'acid', 'transaction', 'views in sql', 'stored procedure',
        'trigger in sql', 'aggregate functions', 'group by', 'having clause', 'ddl vs dml', 'rdbms',
        'which database would you choose and why', 'database design', 'database', 'bcnf', 'what is sql'
    ]):
        return 'dbms'

    # 15. OOP
    if any(k in ql for k in [
        'oop', 'inheritance', 'polymorphism', 'encapsulation', 'abstraction', 'class and object', 
        'constructor', 'four pillars', 'function overloading', 'overriding', 'interface vs abstract',
        'static keyword', 'access specifiers', 'super keyword', 'this keyword', 'destructor',
        'class vs object', 'method overloading', 'what is a class', 'what is an object'
    ]):
        return 'oop'

    # 16. Programming
    if any(k in ql for k in [
        'pointer', 'predict the output', 'c program', 'program involving', 'recursion', 'structures', 
        'chatgpt', 'machine learning', 'technology you recently learned', 'garbage collection',
        'pass by value', 'exception handling', 'try catch', 'generics', 'lambda expression',
        'difference between java and c', 'call by reference', 'explain your code', 'what is java',
        'what is c++', 'what is python', 'features of java', 'jdk vs jre vs jvm', 'string vs stringbuilder',
        'final keyword', 'finally block', 'finalize method', 'jit in java', 'spring boot',
        'data types', 'html, css', 'platform independent'
    ]):
        return 'programming'

    # 17. DSA
    dsa_keywords = [
        'sum', 'array', 'string', 'linked list', 'tree', 'graph', 'island', 'sort', 'search', 
        'dp', 'knapsack', 'lru', 'stack', 'queue', 'heap', 'matrix', 'trie', 'dijkstra', 
        'anagram', 'palindrome', 'parentheses', 'traversal', 'substring', 'subsequence', 
        'kth', 'cycle', 'two sum', 'climbing stairs', 'median', 'pattern matching', 'ladder', 
        'coin change', 'robber', 'binary search', 'fibonacci', 'factorial', 'reverse',
        'rotate', 'merge', 'ancestor', 'breadth first', 'depth first', 'bfs', 'dfs',
        'hashmap', 'hashset', 'hashing', 'hash table', 'priority queue', 'topological',
        'stock', 'course schedule', 'shortest path', 'connected components', 'add two numbers',
        'zigzag', 'element', 'frequent', 'interval', 'jump game', 'gas station', 'word break',
        'rain water', 'root-to-leaf', 'successor', 'boggle', 'decodings', 'balloons', 'matching',
        'people present', 'regular expression', 'greedy algorithm'
    ]
    if any(k in ql for k in dsa_keywords):
        return 'dsa'
        
    return 'other'

def main():
    possible_sources = [
        r'C:\Users\Lenovo\Desktop\DataBase_interview_company_based.docx',
        os.path.join(os.path.dirname(__file__), '..', 'data', 'DataBase_interview_company_based.docx'),
        r'C:\Users\Lenovo\Downloads\company_based_interview_database.docx'
    ]
    source_file = None
    for p in possible_sources:
        if os.path.exists(p):
            source_file = p
            break
            
    if not source_file:
        print("ERROR: Source docx file not found.", file=sys.stderr)
        sys.exit(1)
        
    print(f"Reading from source: {source_file}")
    
    with zipfile.ZipFile(source_file) as z:
        xml_content = z.read('word/document.xml')
        tree = ET.fromstring(xml_content)
        tbl = tree.find('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tbl')
        rows = tbl.findall('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tr')
        
        companies_map = [
            (0, 0, 'Google'), (0, 1, 'Amazon'),
            (2, 0, 'Zoho'), (2, 1, 'Microsoft'),
            (4, 0, 'Apple'), (4, 1, 'Meta'),
            (6, 0, 'Infosys'), (6, 1, 'TCS'),
            (8, 0, 'Adobe'), (8, 1, 'Atlassian'),
            (10, 0, 'High-Growth Startup')
        ]
        
        results = {}
        
        for h_row, col, name in companies_map:
            data_row = h_row + 1
            if data_row >= len(rows):
                continue
            cells = rows[data_row].findall('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tc')
            if col >= len(cells):
                continue
            cell = cells[col]
            
            raw_paras = []
            for p in cell.findall('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
                t = ''.join([node.text for node in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text]).strip()
                if t:
                    raw_paras.append(t)
            
            questions = []
            seen = set()
            
            for p in raw_paras:
                cleaned = re.sub(r'^[\u2022\uf0b7\*\-•\s]+', '', p).strip()
                splits = re.split(r'(?<=[^\d])(?=\d+\.\s+[A-Z])', cleaned)
                for s in splits:
                    q_text = s.strip()
                    q_text = re.sub(r'^[\u2022\uf0b7\*\-•\s]+', '', q_text).strip()
                    q_text = re.sub(r'^\d+\.\s*', '', q_text).strip()
                    
                    if q_text and len(q_text) > 2:
                        norm = re.sub(r'[^a-z0-9]', '', q_text.lower())
                        if norm not in seen:
                            seen.add(norm)
                            cat = categorize_question(q_text)
                            questions.append({
                                'question': q_text,
                                'category': cat
                            })
                            
            results[name] = questions
            print(f"Extracted {len(questions)} questions for {name}")

    out_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, 'company_interviews.json')
    
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
        
    print(f"\nSUCCESS: Exported {sum(len(q) for q in results.values())} questions to {out_file}")

if __name__ == '__main__':
    main()
