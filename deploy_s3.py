from boto.s3.connection import S3Connection
from boto.s3.key import Key
import sys, os

def uploadFile(source, destination):
  print 'Uploading ' + source
  obj = bucket.new_key(destination)
  obj.set_contents_from_filename(source)
  obj.make_public()



aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID')
if not aws_access_key_id:
  print 'Set AWS_ACCESS_KEY_ID environment variable'
  exit(-1)

aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY')
if not aws_secret_access_key:
  print 'Set AWS_SECRET_ACCESS_KEY environment variable'
  exit(-1)

connection = S3Connection(aws_access_key_id, aws_secret_access_key)
bucket = connection.get_bucket('static.qminderapp.com')

uploadFile('dist/qminder-api.min.js', 'api/qminder-api.min.js')