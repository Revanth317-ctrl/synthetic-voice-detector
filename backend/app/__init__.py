import os
# Ensure pure Python fallback in environments with DLL AppLocker policies
os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"
