
			var scrollSpeed = 45; 		// Speed in milliseconds
			var step = 1; 				// How many pixels to move per step
			var current = 0;			// The current pixel row
			var imageWidth = 6120;		// Background image width
			var headerWidth = 680;		// How wide the header is.
			
			//The pixel row where to start a new loop
			var restartPosition = -(imageWidth - headerWidth);
			
			function scrollBg(){
				//Go to next pixel row.
				current -= step;
				
				//If at the end of the image, then go to the top.
				if (current == restartPosition){
					current = 0;
				}
				
				//Set the CSS of the header.
				$('#AnimatedBg').css("background-position",current+"px 0");
			}
			
			//Calls the scrolling function repeatedly
			var init = setInterval("scrollBg()", scrollSpeed);

			
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 