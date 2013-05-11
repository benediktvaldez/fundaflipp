<?php
// error_reporting(E_ALL);
// ini_set('display_errors', true);

	if($_POST['json']){
		$json = $_POST['json'];

		if (json_decode($json) != null) {
			print file_put_contents('js/db.json',$json);
		} else {
			print "error";
		}
	}
?>