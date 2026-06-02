import pymysql
try:
    conn = pymysql.connect(host='localhost', user='root', password='', database='toptruyen_db')
    print('DB OK')
    conn.close()
except Exception as e:
    print('DB FAIL:', type(e).__name__, str(e))
