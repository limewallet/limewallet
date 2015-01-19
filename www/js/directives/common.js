bitwallet_module
.directive('numbersOnlyKeyPress', function(){
   return {
     require: 'ngModel',
     link: function(scope, element, attrs, modelCtrl) {
      var keyCode = [8,9,37,39,46,48,49,50,51,52,53,54,55,56,57,96,97,98,99,100,101,102,103,104,105,110];
      //190 keydown "." @ iOS
      //46 keypress "." @ iOS

      // element.bind("change", function (event) {
        // console.log(event);
        // console.log('change');
      // });
      
      element.bind("keypress", function (event) { //keydown 
          console.log(event.keyCode);
          //console.log(event.which + ' in? ' + (keyCode.indexOf(event.which)));
          //if(!(Number(event.which) in keyCode)) {
          if(keyCode.indexOf(event.keyCode)==-1) {
              //console.log(event.keyCode  + ' PREVENTED and STOPPED!');
              event.preventDefault();
              event.stopPropagation();
              //console.log(event);
              return false;
          }
        });
    }
  }
})
// http://jsfiddle.net/DwKZh/763/
// usage: <input numbers-only-input="numbers-only-input" ...
.directive('numbersOnlyInput', function(){
   return {
     require: 'ngModel',
     link: function(scope, element, attrs, modelCtrl) {
       modelCtrl.$parsers.push(function (inputValue) {
          // this next if is necessary for when using ng-required on your input. 
          // In such cases, when a letter is typed first, this parser will be called
          // again, and the 2nd time, the value will be undefined
          if (inputValue == undefined) return ''; 
          
          //var transformedInput = inputValue.replace(/[^0-9+.]/g, ''); 
          console.log('##1 inputValue:'+ inputValue);
          var original_value = inputValue;
          if(inputValue=='.')
          {
            inputValue='0.';
            console.log('##2 inputValue:'+ inputValue);
          }
          var match = String(inputValue).match(/\d+(\.)?(\d+)?/g);
          var transformedInput = '';
          if (match && match.length>0)
          {   
            transformedInput = match.join('');
            console.log('##3 transformedInput:'+ transformedInput);
          }
          if (transformedInput!=original_value) {
            if(transformedInput && transformedInput!==undefined)
            { 
              console.log('##4 transformedInput:'+ transformedInput);
              modelCtrl.$setViewValue(Number(transformedInput));
            }
            else
            { 
              console.log('##5 transformedInput is none or undefined');
              modelCtrl.$setViewValue(0);
            }
            modelCtrl.$render();
          }      
          if(transformedInput && transformedInput!==undefined)
            return Number(transformedInput); 
            
          console.log('##6 le metemo 0 papa');
          modelCtrl.$setViewValue(0);
          modelCtrl.$render();
          return 0;         
       });
     }
   };
})

.directive('oldNumbersOnlyInput', function () {
    return {
        require: 'ngModel',
        link: function (scope, element, attrs, modelCtrl) {
            scope.$watch(attrs['ngModel'], function(inputValue, oldValue) {
                console.log('#1: ['+inputValue + '] / ['+ oldValue+']');
                // return;
                if(inputValue==undefined && oldValue && oldValue!=undefined)
                {
                  console.log('#1.1: ['+inputValue + '] / ['+ oldValue+']');
                  modelCtrl.$setViewValue(Number(oldValue));
                  modelCtrl.$render();
                  return Number(oldValue);   
                }
                
                if(inputValue==undefined || inputValue=='' || !inputValue){
                  console.log('#1.2: ['+inputValue + '] / ['+ oldValue+']');
                  modelCtrl.$setViewValue(0);
                  modelCtrl.$render();
                  return 0;  
                }
                var original_value = inputValue;
                if(inputValue=='.')
                 inputValue='0.';
                var match = String(inputValue).match(/^0*\d+(\.)?(\d+)?/g);
                var transformedInput = '';
                if (match && match.length>0)
                {
                   transformedInput = match.join('');
                   console.log('#2: ['+inputValue + '] / ['+ oldValue+'] / [' + transformedInput + ']' );
                }
                if(transformedInput=='' || transformedInput==undefined)
                {  
                  transformedInput=oldValue;
                  console.log('#3: ['+inputValue + '] / ['+ oldValue+'] / [' + transformedInput + ']' );
                }
                //if (transformedInput!=original_value) {
                  modelCtrl.$setViewValue(Number(transformedInput));
                  modelCtrl.$render();
                  console.log('#4: setting scope value' );
                //} 
                console.log('#5: '+transformedInput );                
                return Number(transformedInput);         
                // var arr = String(newValue).split("");
                // if (arr.length === 0) 
                // {
                  // scope.inputValue = 0;
                  // return;
                // }
                // if (arr.length === 1 && (arr[0] === '.' )) return;
                // if (arr.length === 2 && newValue === '.') return;
                // if (isNaN(newValue)) {
                    // scope.inputValue = oldValue;
                // }
            });
        }
    };
})


.directive('imageonload', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
          element.on('load', function() {
            scope.hideLoading();
          });
        }
    };
});

