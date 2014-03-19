<?php

$clientId = "YOUR_CLIENT_ID";
$clientSecret = "YOUR_CLIENT_SECRET";
$redirectURI = "YOUR_REDIRECT_URL";

if(isset($_POST['authCode']) && $_POST['getToken']) {

	$authCode = $_POST['authCode'];
		
	$url = "https://readmill.com/oauth/token.json";
	
	// setup variables to post
	$post_fields .= "grant_type=authorization_code";
	$post_fields .= "&client_id=".$clientId;
	$post_fields .= "&client_secret=".$clientSecret;
	$post_fields .= "&redirect_uri=".$redirectURI;
	$post_fields .= "&code=" . $authCode;
	
	// create curl resource
        $ch = curl_init(); 
 
 	// set the url, enable POST return data, number of POST vars, POST data
	curl_setopt($ch,CURLOPT_URL,$url);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER,1);
	curl_setopt($ch,CURLOPT_POST,5);
	curl_setopt($ch,CURLOPT_POSTFIELDS,$post_fields);
	
	// execute curl call
	$output = curl_exec($ch);
	curl_close($ch);
	
	// convert returned curl response to json
	$oAuthObj = json_decode($output);
	
	echo $oAuthObj->access_token;
	
	exit();

}

if(isset($_GET['url']) && $_GET['apiRequest']) {

	// check if client id is needed in URL string to process the API request
	if(isset($_GET['clientId']) && $_GET['clientId'] == true) {
		// check for '?' in the url string. use '?client_id' or '&client_id' respectively
		$needle = strpos($_GET['url'], '?');
		
		if($needle !== false)
			$url = $_GET['url'] . "&client_id=" . $clientId;
		else
			$url = $_GET['url'] . "?client_id=" . $clientId;
	} else {
		$url = $_GET['url'];
	}
	$ch = curl_init();

	// set the url, enable return data
	curl_setopt($ch,CURLOPT_URL,$url);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER,1);
	
	// execute curl call
	$output = curl_exec($ch);
	curl_close($ch);
	
	$requestedObj = json_decode($output);
	
	echo json_encode(array("requestedObj"=>$requestedObj));
	exit();
}
?>