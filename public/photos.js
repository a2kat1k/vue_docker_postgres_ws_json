// ES Modules syntax
//import Unsplash from 'unsplash-js';



unsplash.photos.listPhotos(1, 15, "latest")
  .then(toJson)
  .then(json => {
    // Your code
	console.log("%o",json);
  });