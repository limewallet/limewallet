angular.module('ion-autocomplete', []).directive('ionAutocomplete', [
    '$ionicTemplateLoader', '$ionicBackdrop', '$ionicScrollDelegate', '$rootScope', '$document', '$q', '$parse', '$ionicPlatform',
    function ($ionicTemplateLoader, $ionicBackdrop, $ionicScrollDelegate, $rootScope, $document, $q, $parse, $ionicPlatform) {
        return {
            require: '?ngModel',
            restrict: 'A',
            scope: {
                model: '=ngModel',

                placeholder_: '@',
                searchQueryItemHint: '@',
                localLabel: '@',
                globalLabel: '@',
                isSelectable: '&',
                localSearch: '&',
                globalSearch: '&',
                localValueKey: '@',
                globalValueKey: '@',

                placeholder: '@',
                cancelLabel: '@',
                selectItemsLabel: '@',
                selectedItemsLabel: '@',
                templateUrl: '@',
                itemsMethod: '&',
                itemsMethodValueKey: '@',
                itemValueKey: '@',
                itemViewValueKey: '@',
                multipleSelect: '@',
                itemsClickedMethod: '&',
                itemsRemovedMethod: '&',
                componentId: '@',
                modelToItemMethod: '&'
            },
            link: function (scope, element, attrs, ngModel) {

                // do nothing if the model is not set
                if (!ngModel) return;

                scope.localLabel    = !scope.localLabel ? '' : scope.localLabel;
                scope.globalLabel   = !scope.globalLabel ? '' : scope.globalLabel;
                scope.searchQueryItemHint = !scope.searchQueryItemHint ? '' : scope.searchQueryItemHint;
                scope.placeholder_ = !scope.placeholder_ ? 'Click to enter a value...' : scope.placeholder_;

                // set the default values of the passed in attributes
                scope.placeholder = !scope.placeholder ? 'Click to enter a value...' : scope.placeholder;
                scope.cancelLabel = !scope.cancelLabel ? scope.multipleSelect === "true" ? 'Done' : 'Cancel' : scope.cancelLabel;
                scope.selectItemsLabel = !scope.selectItemsLabel ? 'Select an item...' : scope.selectItemsLabel;
                scope.selectedItemsLabel = !scope.selectedItemsLabel ? 'Selected items:' : scope.selectedItemsLabel;
                scope.templateUrl = !scope.templateUrl ? '' : scope.templateUrl;

                // the items, selected items and the query for the list
                scope.items = [];
                //scope.selectedItems = [];
                scope.searchQuery = '';

                scope.enable_select         = false;
                scope.local_contacts        = [];
                scope.global_contacts       = [];
                scope.show_loading          = false;
                scope.global_search_timeout = 0;
                scope.selected_result       = {};

                // returns the value of an item
                scope.getItemValue = function (item, key) {

                    // if it's an array, go through all items and add the values to a new array and return it
                    if (angular.isArray(item)) {
                        var items = [];
                        angular.forEach(item, function (itemValue) {
                            if (key && angular.isObject(item)) {
                                items.push($parse(key)(itemValue));
                            } else {
                                items.push(itemValue);
                            }
                        });
                        return items;
                    } else {
                        if (key && angular.isObject(item)) {
                            return $parse(key)(item);
                        }
                    }
                    return item;
                };

                var searchContainerTemplate = [
                    '<div class="ion-autocomplete-container modal">',
                    '<div class="bar bar-header item-input-inset">',
                    '<label class="item-input-wrapper">',
                    '<i class="icon ion-ios7-search placeholder-icon"></i>',
                    '<input type="search" class="ion-autocomplete-search" ng-model="searchQuery" autocapitalize="off" placeholder="{{placeholder_}}"/>',
                    '</label>',
                    '<button class="ion-autocomplete-cancel button button-clear">{{cancelLabel}}</button>',
                    '</div>',
                    '<ion-content class="has-header has-header">',
                    '<ion-list>',
                    
                    '<ion-item item-height="55" item-width="100%" class="search" ng-show="enable_select" type="item-text-wrap" ng-click="selectItem(getSearchQueryItem())">',
                    '{{searchQuery}}',
                    '<p ng-show="searchQueryItemHint.length>0">{{searchQueryItemHint}}</p>',
                    '</ion-item>',
                    

                    '<div class="collection-repeat-container">',
                    '<ion-item type="item-text-wrap" class="item-divider item-icon-right" ng-show="local_contacts.length > 0">',
                    '{{localLabel}}',
                    '<i class="icon ion-ios-people"></i>',
                    '</ion-item>',

                    '<ion-item ng-repeat="item in local_contacts" item-height="55" item-width="100%" class="local" type="item-text-wrap" ng-click="selectItem(item)">',
                    '<h2>{{getItemValue(item, itemViewValueKey)}}</h2>',
                    '<p>{{item.address_or_pubkey}}</p>',
                    '</ion-item>',
                    '</div>',

                    '<div class="collection-repeat-container">',
                    '<ion-item type="item-text-wrap" class="item-divider item-icon-right" ng-show="global_contacts.length > 0 || global_error">',
                    '{{globalLabel}}',
                    '<i class="icon ion-earth""></i>',
                    '</ion-item>',
                    
                    '<ion-item item-height="55" item-width="100%" ng-show="show_loading" type="item-text-wrap" >',
                    '<ion-spinner icon="android"></ion-spinner>',
                    '</ion-item>',

                    '<ion-item item-height="55" item-width="100%" ng-show="global_error" type="item-text-wrap" >',
                    '<p> Error tap to retry </p>',
                    '</ion-item>',

                    '<ion-item ng-repeat="item in global_contacts" item-height="55" item-width="100%" class="global" type="item-text-wrap" ng-click="selectItem(item)">',
                    '<h2>{{getItemValue(item, itemViewValueKey)}}</h2>',
                    '<p>{{item.address_or_pubkey}}</p>',
                    '</ion-item>',
                    '</div>',
    
                    '</ion-list>',
                    '</ion-content>',
                    '</div>'
                ].join('');


                // compile the popup template
                $ionicTemplateLoader.compile({
                    templateUrl: scope.templateUrl,
                    template: searchContainerTemplate,
                    scope: scope,
                    appendTo: $document[0].body
                }).then(function (compiledTemplate) {

                    // get the compiled search field
                    var searchInputElement = angular.element(compiledTemplate.element.find('input'));

                    // function which selects the item, hides the search container and the ionic backdrop if it is not a multiple select autocomplete
                    compiledTemplate.scope.selectItem = function (item) {

                        // clear the items and the search query
                        compiledTemplate.scope.items = [];
                        compiledTemplate.scope.searchQuery = '';

                        // set the view value and render it
                        console.log(' - selectItem:'+JSON.stringify(item));
                        ngModel.$setViewValue(item);
                        // hide the container and the ionic backdrop
                        hideSearchContainer();
                        
                        // call items clicked callback
                        if (angular.isFunction(compiledTemplate.scope.itemsClickedMethod)) {
                            compiledTemplate.scope.itemsClickedMethod({
                                callback: {
                                    item: item,
                                    //selectedItems: compiledTemplate.scope.selectedItems.slice(),
                                    componentId: compiledTemplate.scope.componentId
                                }
                            });
                        }
                    };

                    // watcher on the search field model to update the list according to the input
                    compiledTemplate.scope.$watch('searchQuery', function (query) {

                        // if the search query is empty, clear the items
                        // if (query == '') {
                        //     compiledTemplate.scope.items = [];
                        // }

                        //$ionicScrollDelegate.resize();
                        console.log(' onSearchQuery Changed: '+query);
                        compiledTemplate.scope.enable_select   = false;
                        compiledTemplate.scope.local_contacts  = [];
                        compiledTemplate.scope.global_contacts = [];

                       // Callback that determines if the input is an address or a pubkey
                        if (query && angular.isFunction(compiledTemplate.scope.isSelectable)) {

                            var promise = $q.when(compiledTemplate.scope.isSelectable({query: query}));

                            promise.then(function (is_pubkey) {

                              compiledTemplate.scope.enable_select   = true;
                              compiledTemplate.scope.selected_result = {
                                name              : compiledTemplate.scope.searchQuery,
                                address_or_pubkey : compiledTemplate.scope.searchQuery,
                                is_pubkey         : is_pubkey
                              };
                              //console.log(' onSearchQuery isSelectable OK ');
                            }, function (error) {
                              //console.log(' onSearchQuery isSelectable ERROR '+JSON.stringify(error));
                              compiledTemplate.scope.enable_select   = false;
                              compiledTemplate.scope.selected_result = {};
                              return $q.reject(error);
                            });
                        }

                        // Callback that searchs in global directory
                        if (query && angular.isFunction(compiledTemplate.scope.globalSearch)) {
                            scope.show_loading = true;

                            clearTimeout(scope.global_search_timeout);
                            scope.global_search_timeout = setTimeout(function() {
                              
                              // convert the given function to a $q promise to support promises too
                              var promise = $q.when(compiledTemplate.scope.globalSearch({query: query}));
                              
                              promise.then(function (promiseData) {
                                  // set the items which are returned by the items method
                                  var tmp = compiledTemplate.scope.getItemValue(promiseData, compiledTemplate.scope.globalValueKey);

                                  var global_contacts = [];
                                  tmp.forEach( function(contact) {
                                    var active_key = contact.active_key_history.pop()[1];
                                    global_contacts.push({
                                      name              : contact.name,
                                      address_or_pubkey : active_key,
                                      is_pubkey         : true
                                    });
                                  });

                                  compiledTemplate.scope.global_contacts = global_contacts;
                                  scope.show_loading                     = false;
                                  $ionicScrollDelegate.resize();
                              }, function (error) {
                                  console.log(' onSearchQuery globalSearch ERROR '+JSON.stringify(error));
                                  // reject the error because we do not handle the error here
                                  scope.show_loading = false;
                                  return $q.reject(error);
                              });
                           }, 1500);
                        }
                       
                        // Callback that searchs in local directory
                        if (query && angular.isFunction(compiledTemplate.scope.localSearch)) {
                            // convert the given function to a $q promise to support promises too
                            var promise = $q.when(compiledTemplate.scope.localSearch({query: query}));

                            promise.then(function (promiseData) {
                                // set the items which are returned by the items method
                                var tmp = compiledTemplate.scope.getItemValue(promiseData, compiledTemplate.scope.localValueKey);

                                var local_contacts = [];
                                tmp.forEach( function(contact) {
                                  local_contacts.push({
                                    name              : contact.name,
                                    address_or_pubkey : contact.address_or_pubkey,
                                    is_pubkey         : contact.is_pubkey
                                  });
                                });

                                compiledTemplate.scope.local_contacts = local_contacts;

                            }, function (error) {
                                // reject the error because we do not handle the error here
                                return $q.reject(error);
                            });
                        }

                    });

                    var displaySearchContainer = function () {
                        $ionicBackdrop.retain();
                        compiledTemplate.element.css('display', 'block');
                        scope.$deregisterBackButton = $ionicPlatform.registerBackButtonAction(function () {
                            hideSearchContainer();
                        }, 300);
                    };

                    var hideSearchContainer = function () {
                        compiledTemplate.element.css('display', 'none');
                        $ionicBackdrop.release();
                        scope.$deregisterBackButton && scope.$deregisterBackButton();
                    };

                    // object to store if the user moved the finger to prevent opening the modal
                    var scrolling = {
                        moved: false,
                        startX: 0,
                        startY: 0
                    };

                    // store the start coordinates of the touch start event
                    var onTouchStart = function (e) {
                        scrolling.moved = false;
                        // Use originalEvent when available, fix compatibility with jQuery
                        if (typeof(e.originalEvent) !== 'undefined') {
                            e = e.originalEvent;
                        }
                        scrolling.startX = e.touches[0].clientX;
                        scrolling.startY = e.touches[0].clientY;
                    };

                    // check if the finger moves more than 10px and set the moved flag to true
                    var onTouchMove = function (e) {
                        // Use originalEvent when available, fix compatibility with jQuery
                        if (typeof(e.originalEvent) !== 'undefined') {
                            e = e.originalEvent;
                        }
                        if (Math.abs(e.touches[0].clientX - scrolling.startX) > 10 ||
                            Math.abs(e.touches[0].clientY - scrolling.startY) > 10) {
                            scrolling.moved = true;
                        }
                    };

                    // click handler on the input field to show the search container
                    var onClick = function (event) {
                        // only open the dialog if was not touched at the beginning of a legitimate scroll event
                        if (scrolling.moved) {
                            return;
                        }

                        // prevent the default event and the propagation
                        event.preventDefault();
                        event.stopPropagation();

                        // show the ionic backdrop and the search container
                        displaySearchContainer();

                        // focus on the search input field
                        if (searchInputElement.length > 0) {
                            searchInputElement[0].focus();
                            setTimeout(function () {
                                searchInputElement[0].focus();
                            }, 0);
                        }
                    };

                    var isKeyValueInObjectArray = function (objectArray, key, value) {
                        for (var i = 0; i < objectArray.length; i++) {
                            if (scope.getItemValue(objectArray[i], key) === value) {
                                return true;
                            }
                        }
                        return false;
                    };

                    // function to call the model to item method and select the item
                    var resolveAndSelectModelItem = function (modelValue) {
                        // convert the given function to a $q promise to support promises too
                        var promise = $q.when(compiledTemplate.scope.modelToItemMethod({modelValue: modelValue}));

                        promise.then(function (promiseData) {
                            // select the item which are returned by the model to item method
                            compiledTemplate.scope.selectItem(promiseData);
                        }, function (error) {
                            // reject the error because we do not handle the error here
                            return $q.reject(error);
                        });
                    };

                    // bind the handlers to the click and touch events of the input field
                    element.bind('touchstart', onTouchStart);
                    element.bind('touchmove', onTouchMove);
                    element.bind('touchend', onClick);
                    element.bind('click', onClick);

                    // cancel handler for the cancel button which clears the search input field model and hides the
                    // search container and the ionic backdrop
                    compiledTemplate.element.find('button').bind('click', function (event) {
                        compiledTemplate.scope.searchQuery = '';
                        hideSearchContainer();
                    });

                    // prepopulate view and selected items if model is already set
                    if (compiledTemplate.scope.model && angular.isFunction(compiledTemplate.scope.modelToItemMethod)) {
                        if (compiledTemplate.scope.multipleSelect === "true" && angular.isArray(compiledTemplate.scope.model)) {
                            angular.forEach(compiledTemplate.scope.model, function (modelValue) {
                                resolveAndSelectModelItem(modelValue);
                            })
                        } else {
                            resolveAndSelectModelItem(compiledTemplate.scope.model);
                        }
                    }

                });

                // render the view value of the model
                // ngModel.$render = function () {
                //     element.val(scope.getItemValue(ngModel.$viewValue, scope.itemViewValueKey));
                // };

                // set the view value of the model
                // ngModel.$formatters.push(function (value) {
                //     if(value)
                //     {
                //         console.log(' -- ngModel.$formatters.push modelValue: '+JSON.stringify(value));
                //         console.log(' -- ngModel.$formatters.push scope.itemViewValueKey: '+ scope.itemViewValueKey);

                //         var viewValue = scope.getItemValue(value, scope.itemViewValueKey);
                //         console.log(' -- ngModel.$formatters.push viewValue:'+JSON.stringify(viewValue));
                //         console.log(' -- ngModel.$formatters.push value.name:'+value.name);
                //         return viewValue == undefined ? "" : viewValue;
                //     }
                //     return "";
                // });
                
                // Source: http://stackoverflow.com/questions/20101054/angularjs-setviewvalue-not-responding-in-parsers-push
                // set the model value of the model
                ngModel.$parsers.push(function (viewValue) {
                    ngModel.$viewValue = scope.getItemValue(viewValue, scope.itemViewValueKey);
                    ngModel.$render();                    
                    return scope.getItemValue(viewValue, scope.itemValueKey);
                    // return viewValue.name;
                });

            }
        };
    }
]).directive('ionAutocomplete', function () {
    return {
        require: '?ngModel',
        restrict: 'E',
        template: '<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" />',
        replace: true
    }
});
