<?php

	// redirect to readmill authentication
	header("Location: https://readmill.com/oauth/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URL&scope=non-expiring");
?>