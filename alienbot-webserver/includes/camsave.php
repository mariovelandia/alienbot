<?php

$fileName = $_POST['fileName'];
$rawData = $_POST['imgBase64'];
$filteredData = explode(',', $rawData);

$unencoded = base64_decode($filteredData[1]);

$fp = fopen('../uploads/'.$fileName.'.png', 'w');
fwrite($fp, $unencoded);
fclose($fp);