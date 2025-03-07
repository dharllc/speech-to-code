import os,json,time,ast
from typing import Dict,List,Optional
from datetime import datetime

def parse_python_file(content:str)->List[str]:
    try:
        tree=ast.parse(content)
        functions=[node.name for node in ast.walk(tree) if isinstance(node,ast.FunctionDef)]
        imports=[]
        for node in ast.walk(tree):
            if isinstance(node,ast.Import):
                imports.extend(n.name for n in node.names)
            elif isinstance(node,ast.ImportFrom):
                imports.append(f"{node.module}.{node.names[0].name}")
        return list(set(functions+imports))
    except:return[]

def parse_javascript_file(content:str)->List[str]:
    import re
    functions=re.findall(r'(?:function\s+(\w+)|(\w+)\s*=\s*(?:function|\([^)]*\)\s*=>))',content)
    imports=re.findall(r'(?:import\s+{\s*([^}]+)\s*}|import\s+(\w+))\s+from',content)
    elements=[item for group in functions+imports for item in group if item]
    return list(set(elements))

def extract_readme_description(content:str)->str:
    lines=[line.strip() for line in content.split('\n') if line.strip()]
    if not lines:return ""
    description=[]
    for line in lines:
        if line.startswith('#'):continue
        description.append(line)
        if len(' '.join(description))>500:break
    return ' '.join(description)[:500]

def get_file_metadata(filepath:str,content:str)->Dict:
    file_type=os.path.splitext(filepath)[1][1:].lower()
    key_elements=[]
    if file_type=='py':key_elements=parse_python_file(content)
    elif file_type=='js':key_elements=parse_javascript_file(content)
    return{
        'type':file_type,
        'size':len(content),
        'lastModified':datetime.fromtimestamp(os.path.getmtime(filepath)).isoformat(),
        'key_elements':key_elements,
        'summary':f"{'Function' if key_elements else 'File'} containing {len(key_elements)} key elements"
    }

def generate_context_map(repo_path:str,repo_name:str)->Dict:
    if not os.path.exists(repo_path):
        raise ValueError(f"Repository path not found: {repo_path}")
    
    # Directories to exclude
    EXCLUDED_DIRS = {
        '.git', 'node_modules', 'venv', '__pycache__',
        '.next', # Next.js build output
        'out', # Next.js static export
        'build', # Build directories
        'dist',
        'coverage', # Test coverage
        '.vercel', # Vercel deployment
        'public/static', # Static assets
        '.turbo', # Turborepo cache
    }

    # File extensions to exclude
    EXCLUDED_EXTENSIONS = {
        # Build artifacts
        'map', # Source maps
        'min.js', 'min.css', # Minified files
        # Binary and media files
        'jpg', 'jpeg', 'png', 'gif', 'ico', 'svg', 'webp',
        'mp3', 'mp4', 'wav', 'ogg', 'webm',
        'pdf', 'doc', 'docx', 'xls', 'xlsx',
        'ttf', 'woff', 'woff2', 'eot',
        # Cache and temporary files
        'cache', 'log', 'tmp',
        # Package management
        'lock', 'yarn.lock',
    }

    # Specific files to exclude
    EXCLUDED_FILES = {
        'package-lock.json',
        'yarn.lock',
        '.npmrc',
        '.yarnrc',
        '.env',
        '.env.local',
        '.env.development',
        '.env.production',
        '.env.test',
        'tsconfig.tsbuildinfo',
        '.eslintcache',
    }
    
    context_map={
        'repositoryId':repo_name,
        'lastUpdated':datetime.now().isoformat(),
        'files':{},
        'projectDescription':''
    }

    for root,_,files in os.walk(repo_path):
        # Skip excluded directories
        if any(x in root.split(os.sep) for x in EXCLUDED_DIRS):
            continue
        
        for file in files:
            # Skip files starting with dot, excluded files, and excluded extensions
            if (file.startswith('.') or 
                file in EXCLUDED_FILES or 
                any(file.endswith(f'.{ext}') for ext in EXCLUDED_EXTENSIONS)):
                continue

            filepath=os.path.join(root,file)
            relpath=os.path.relpath(filepath,repo_path)
            
            try:
                with open(filepath,'r',encoding='utf-8')as f:
                    content=f.read()
                
                if file.lower()=='readme.md':
                    context_map['projectDescription']=extract_readme_description(content)
                else:
                    context_map['files'][relpath]=get_file_metadata(filepath,content)
            except:continue

    return context_map

def save_context_map(context_map:Dict,base_path:str)->None:
    os.makedirs(base_path,exist_ok=True)
    filepath=os.path.join(base_path,f"{context_map['repositoryId']}.json")
    with open(filepath,'w')as f:
        json.dump(context_map,f,indent=2)

def load_context_map(repo_name:str,base_path:str)->Optional[Dict]:
    filepath=os.path.join(base_path,f"{repo_name}.json")
    if not os.path.exists(filepath):return None
    with open(filepath)as f:
        return json.load(f)