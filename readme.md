# Create new table
POST:
	/api/<TABLE_NAME>/create?strict=<STRICT> # <STRICT>: true | false  

# Delete a table
DELETE:
	/api/<TABLE_NAME>/delete

# Query all
GET:
	/api/<TABLE_NAME>/

# Query one
GET:
	/api/<TABLE_NAME>/<ID>

# Insert one
POST:
	/api/<TABLE_NAME>

# update one
PATCH:
	/api/<TABLE_NAME>/<ID>

# delete one
DELETE:
	/api/<TABLE_NAME>/<ID>
