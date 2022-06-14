#!/bin/bash

set -e

: "${environment:?environment not set or empty}"

echo "Zip the app"
timestamp=$(date +"%Y%M%d%H%M%N")
blobName="webapp${timestamp}.zip"
zip -q -r "$blobName" . -x@.appserviceignore -x .funcignore

echo "Perform a ZIP deployment"
az webapp deployment source config-zip --resource-group "jcomm-${environment}-eus-rgp" --name "jcomm-${environment}-eus-webapp" --src "$blobName"
