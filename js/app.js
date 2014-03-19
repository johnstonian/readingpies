 $(function () {
 	/****************************** INITIAL SETUP ******************************/
	//setup variables
	var accessToken = "";
	var userObj = "";
	var readingsObj = "";
	var bookArray = [];
	var pieData = [];

	var $spinner = $('.spinner');
	$spinner.css({top: '50%', left: '50%', display: 'block'});
	
	// show spinner when ajax call is requested
	// hide spinner when ajax call is finished
	$('.spinner')
	    .hide()  // hide it initially
	    .ajaxStart(function() {
	        $(this).show();
	    })
	    .ajaxStop(function() {
	        $(this).hide();
	    });	    
	/****************************** END INITIAL SETUP **************************/
	
	/****************************** RUN APP ************************************/
	// get authorization code sent from the readmill oauth page
	var authCode = getQueryVariable("code");

	// start the app
	getAccessToken(authCode);
	
	/****************************** END RUN APP ********************************/
	
	/****************************** APP FUNCTIONS ******************************/
	// get and set access token
	function getAccessToken(code) {
		$.ajax({
			type: "POST",
			url: "functions.php",
			data: { authCode : code, getToken : true },
			success: function(data) {
				accessToken = data;
				
				// now get user object
				getUserObj(accessToken);
			}
		});
	}
	

	// get Readmill user Object
	function getUserObj(token) {
		var userURL = "https://api.readmill.com/v2/me?access_token="+token;		
		
		$.getJSON( 'functions.php', { url: userURL, apiRequest: true }, function(data) {
				userObj = data.requestedObj.user;
				
				// add name to fullname div
				$('#fullname').html(userObj.fullname + "<br /><span style='font-size: 14px;'>joined " + prettyDate(new Date(userObj.created_at), "joinDate") + "</span>");
				
				// now get list of user's readings
				getReadings(token);
			}
		);
	}
	
	// get readings for user
	function getReadings(token) {
		var readingsURL = "https://api.readmill.com/v2/users/"+userObj.id+"/readings?states=reading,finished,abandoned&access_token="+token;
		$.getJSON( 'functions.php', { url: readingsURL, apiRequest: true, clientId: true }, function(data) {
				readingsObj = data.requestedObj.items;
				
				// get length of reading Object
				var objLength = readingsObj.length;
				
				// setup an array of book objects with book id, title, and total reading time
				// loop through object of readings and create a custom object for use later
				for(i=0; i<objLength; ++i) {
					if(readingsObj[i].reading.duration > 3600) {
						thisBook = new Object();
						thisBook.readingId = readingsObj[i].reading.id;
						thisBook.bookId = readingsObj[i].reading.book.id;
						thisBook.title = readingsObj[i].reading.book.title;
						thisBook.author = readingsObj[i].reading.book.author;
						thisBook.duration = readingsObj[i].reading.duration;
						bookArray.push(thisBook);
					}
				}
				
				// create data set for pie graph based off bookArray
				pieData = setupPieData(bookArray);
				
				createPie('overviewPie', pieData);
			}
		);
	}
	
	// create data set for pie graph based off array sent in
	function setupPieData(thisArray) {
		var thisData = []
		
		// loop through thisArray and set label as book title
		// set data as the reading duration
		var thisLength = thisArray.length;
		
		for(i=0; i<thisLength; ++i) {
			thisData[i] = { label: thisArray[i].title, data: thisArray[i].duration }
		}
		
		return thisData;
		
	}
	
	// use dataset from readmill api to create a pie graph using the flot plugin
	function createPie(id, data) {
	
		$("#"+id).parent().fadeIn();
	
		$.plot($("#"+id), data, 
		{
			series: {
				pie: { 
					show: true,
					radius: 3/4,
					tilt: 0.5,
					label: {
						show: true,
						radius: 3/4,
						formatter: function(label, series){
						
							// do time formatting
							// series.data[0][1] is where flot holds the data value. in this case the reading duration
							var totalTime = prettyReadingTime(series.data[0][1]); 
							
							//return '<div style="font-size:8pt;text-align:center;padding:4px;color:white;">'+label+'<br/>'+Math.round(series.percent)+'%</div>';
							return '<div style="font-size:10pt;text-align:center;padding:4px;color:white;">'+label+'<br/>'+totalTime+'</div>';
						},
						background: { color: '#000', opacity: 0.5 }
					}
				}
			},
			legend: {
				show: false
			},
			grid: {
				hoverable: true,
				clickable: true
			}/*,
			colors: ["#0050CD", "#1B3F57", "#067BF5", "#BA8641", "#87C2F9"]*/
		});
		
		// only add click state if showing the overview pie
		if(id = 'overviewPie') {
			$("#overviewPie").bind("plotclick", pieClick);
		}
	
	}
	
	// handles the back to books link
	$("#backToBooks").bind("click", function() { 
		$("#selectedContainer").fadeOut(function() { 
				$("#highlights").hide();
				$("#overviewContainer").fadeIn();
			
			} 
		);
		
	});
	
	function pieClick(event, pos, obj) 
	{
		if (!obj)
	                return;
	        
	        // get title of book from label
	        var bookTitle = obj.series.label;
	        
	        // get parent div id
	        var pieID = event.target.id;
	        
	        // hide parent div id of clicked item
	        $("#"+pieID).parent().fadeOut('slow', function() {
	        	// generate new pie graph based on pie piece clicked
	        	generateNewPie(bookTitle);
	        });
	}
	
	// gets book id from bookArray based off of book title sent into the function
	// creates a new pie with reading periods for book chosen
	function generateNewPie(bTitle) {
		var thisBook = findNeedle(bookArray, bTitle);
		
		
		$("#bookTitle").html(thisBook.title  +"<br /><span style='font-size: 14px;color:#5A5A5A;'>by " + thisBook.author + "</span>");
		
		getReadingPeriodsForBook(thisBook.readingId);
	}
	
	function getReadingPeriodsForBook(readingId) {
		var periodURL = "https://api.readmill.com/v2/readings/"+readingId+"/periods";
		$.getJSON( 'functions.php', { url: periodURL, apiRequest: true, clientId: true }, function(data) {
				
				var thisArray = [];
				
				periodObj = data.requestedObj.items;
				
				// get length of reading Object
				var objLength = periodObj.length;
				
				// setup an array of book objects with book id, title, and total reading time
				// loop through object of readings and create a custom object for use later
				for(i=0; i<objLength; ++i) {
					thisPeriod = new Object();
					thisPeriod.title = prettyDate(new Date(periodObj[i].period.started_at), "readingDate");
					thisPeriod.duration = periodObj[i].period.duration;
					thisArray.push(thisPeriod);
				}
				
				// create data set for pie graph based off thisArray
				var thisPieData = setupPieData(thisArray);
				
				createPie('detailedPie', thisPieData);
				
				getHighlights(readingId);
			}
		);
		
	}
		
	function getHighlights(readingId) {
		var highlightsURL = "https://api.readmill.com/v2/readings/"+readingId+"/highlights";
		$.getJSON( 'functions.php', { url: highlightsURL, apiRequest: true, clientId: true }, function(data) {
				
				var hlObj = data.requestedObj.items;
				
				$("#highlights").empty();
				
				var htmlString = "<h2>Highlights</h2>";
				
				if(hlObj.length > 0) {
					for(i=0;i<hlObj.length; ++i) {
						htmlString += "<p>" + hlObj[i].highlight.content + "</p>";
						htmlString += "<span>- " + prettyDate(new Date(hlObj[i].highlight.highlighted_at), "highlightDate") + "</span>";
						//alert(hlObj[i].highlight.content);
					}
				} else {
					htmlString += "<p>no highlights...</p>"
				}
					
				$("#highlights").html(htmlString);
				$("#highlights").show();

			}
		);
	}
	
	
	/****************************** END APP FUNCTIONS **************************/
	
	
	/****************************** HELPER FUNCTIONS ***************************/
	
	// from css-tricks.com
	// http://css-tricks.com/snippets/javascript/get-url-variables/
	function getQueryVariable(variable)
	{
	       var query = window.location.search.substring(1);
	       var vars = query.split("&");
	       for (var i=0;i<vars.length;i++) {
	               var pair = vars[i].split("=");
	               if(pair[0] == variable){return pair[1];}
	       }
	       return(false);
	}
	
	
	// adapted from StackOverflow: http://stackoverflow.com/questions/5181493/how-to-find-a-value-in-a-multidimensional-object-array-in-javascript
	// finds a title in the bookArray object and returns that object
	function findNeedle(obj, title) {
	    var returnKey = -1;
	
	    $.each(obj, function(key, info) {
	        if (info.title == title) {
	           returnKey = key;
	           return false; 
	        };   
	    });
	
	    return bookArray[returnKey];       
	}
	
	function prettyDate(date, outputType) {
		var shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		var longMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

		
		if(outputType == "readingDate") {
			return shortMonths[date.getMonth()] + " " + date.getDate();
		} else if(outputType == "joinDate") {
			return longMonths[date.getMonth()] + " " + date.getFullYear();
		} else if(outputType = "highlightDate") {
			return longMonths[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
		}
		
	}
	
	function prettyReadingTime(time) {
		
		var totalTime = "";
		
		// setup hour string
		var totalHours = Math.floor(time / 60 / 60);
		if(totalHours > 0)
			totalHours = totalHours + "h";
		totalTime = totalHours;
		
		// setup minute string
		var totalMins = time % (60*60);
   		var totalMins = Math.floor(totalMins / 60);
   		if(totalMins > 0)
  			totalMins = totalMins + "m";
 
  			
  		// setup "pretty-fied" total time to return
  		if(totalHours == 0) {
  			totalTime = totalMins;
  		} else if(totalHours != 0 && totalMins != 0) {
  			totalTime = totalHours + " " + totalMins;
  		} else if(totalMins == 0) {
  			totalTime = totalHours;
  		}
  		
  		return totalTime;
  		
	}
	/****************************** END HELPER FUNCTIONS ***********************/

}); // end jquery