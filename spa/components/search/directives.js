appComponents

    .directive('travelSearchForm', function ($templateCache) {
        return {
            restrict: 'E',
            template: $templateCache.get('search/tpl/form.html'),
            scope: {
                partnerSite: "@",
                partnerName: "@",
                partnerDefaultCity: "@"
            },
            controller: ['$element', '$scope', '$http', 'Validators', function ($element, $scope, $http, Validators) {

                /**
                 * установка текущей локали
                 */
                if ($scope.partnerDefaultCity) {
                    $http.get('https://inna.ru/api/v1/Dictionary/Directory', {
                        params: {
                            term: $scope.partnerDefaultCity.trim()
                        }
                    }).then(function (response) {
                        var fullName = response.data[0].Name + ", " + response.data[0].CountryName;
                        $scope.locationFrom = {id: response.data[0].Id, name: fullName, iata: response.data[0].CodeIata};
                    });
                } else {
                    $http.get('https://inna.ru/api/v1/Dictionary/GetCurrentLocation').success(function (response) {
                        var fullName = response.Name + ", " + response.CountryName;
                        $scope.locationFrom = {id: response.Id, name: fullName, iata: response.CodeIata};
                    });
                }

                /**
                 * https://inna.ru/api/v1/Dictionary/Directory
                 */
                $scope.getLocationFrom = function (val) {
                    return $http.get('https://inna.ru/api/v1/Dictionary/Directory', {
                        params: {
                            term: val.split(', ')[0].trim()
                        }
                    }).then(function (response) {
                        var data = []
                        angular.forEach(response.data, function (item) {
                            var fullName = item.Name + ", " + item.CountryName;
                            var allArport = item.Airport ? " (все аэропорты)" : ""
                            var fullNameHtml = "<span class='i-name'>" + item.Name + "</span>," + "<span class='i-country'>" + item.CountryName + allArport + "</span>";
                            data.push({id: item.Id, nameHtml: fullNameHtml, name: fullName, iata: item.CodeIata});
                            if (item.Airport) {
                                angular.forEach(item.Airport, function (item) {
                                    var fullName = item.Name + ", " + item.CountryName;
                                    var fullNameHtml = "<span class='i-name i-name-airport'>" + item.Name + "</span>";
                                    data.push({id: item.Id, nameHtml: fullNameHtml, name: fullName, iata: item.CodeIata});
                                });
                            }
                        });
                        return data;
                    });
                };


                /**
                 * автокомплит выбора локации
                 * @param val
                 * @returns {*}
                 */
                $scope.getLocation = function (val) {
                    return $http.get('https://inna.ru/api/v1/Dictionary/Hotel', {
                        params: {
                            term: val.split(', ')[0].trim()
                        }
                    }).then(function (response) {
                        var data = []
                        angular.forEach(response.data, function (item) {
                            var fullName = item.Name + ", " + item.CountryName
                            var fullNameHtml = "<span class='i-name'>" + item.Name + "</span>," + "<span class='i-country'>" + item.CountryName + "</span>"
                            data.push({id: item.Id, nameHtml: fullNameHtml, name: fullName, iata: item.CodeIata});
                        });
                        return data;
                    });
                };


                /**
                 * BEGIN datapicker
                 */
                $scope.setStartDate = new Date();

                var highlightDates = function (date) {
                    var month = date.getMonth() + 1;
                    var dates = date.getDate() + "." + month + "." + date.getFullYear()
                    var oneDay;
                    if ($scope.startDate == $scope.endDate) {
                        oneDay = $scope.startDate;
                    }

                    if (dates == oneDay) {
                        return {
                            classes: 'one_date'
                        };
                    } else {
                        if (dates == $scope.startDate) {
                            return {
                                classes: 'from_date'
                            };
                        }
                        if (dates == $scope.endDate) {
                            return {
                                classes: 'to_date'
                            };
                        }
                    }
                };

                $element.find('.from_date').on('changeDate', function (selected) {
                    $scope.setStartDate = selected.date;
                    $element.find('.to_date').datepicker('setStartDate', new Date(selected.date.valueOf()));
                    $element.find('.to_date').datepicker('setEndDate', new Date(selected.date.valueOf() + 86400000 * 28));
                    $element.find('.to_date').focus();
                });

                $element.find('.input-daterange').datepicker({
                    format: "d.m.yyyy",
                    startDate: $scope.setStartDate,
                    endDate: new Date($scope.setStartDate.valueOf() + 86400000 * 365),
                    language: "ru",
                    autoclose: true,
                    todayHighlight: true,
                    beforeShowDay: highlightDates
                });
                /**
                 * END datapicker
                 */


                /**
                 * BEGIN PEOPLE_COUNTER
                 */
                $scope.adultCount = 2;
                /**
                 * END PEOPLE_COUNTER
                 */


                $scope.$watch('locationFrom', function (data) {
                    if (data && data.id) {
                        $scope.fromId = data.id;
                    } else {
                        $scope.fromId = null;
                    }
                });
                $scope.$watch('locationTo', function (data) {
                    if (data && data.id) {
                        $scope.toId = data.id;
                    } else {
                        $scope.toId = null;
                    }
                });
                $scope.startDateError = null;
                $scope.endDateError = null;
                $scope.$watch('startDate', function (data) {
                    $scope.startDate = data;
                });
                $scope.$watch('endDate', function (data) {
                    $scope.endDate = data;
                });

                /**
                 * Старт поиска
                 * "6733-6623-13.11.2014-19.11.2014-1-2-5_0_11"
                 * @param innaSearchForm
                 */
                $scope.innaStartSearch = function (innaSearchForm) {

                    try {
                        validate();

                        var params = [];
                        params.push($scope.fromId)
                        params.push($scope.toId)
                        params.push($scope.startDate)
                        params.push($scope.endDate)
                        params.push(0)
                        params.push($scope.adultCount)
                        params[6] = ''

                        if ($scope.childrensAge) {
                            var childs = [];
                            for (var i = 0; i < $scope.childrensAge.length; i++) {
                                childs.push($scope.childrensAge[i].value)
                            }
                            params[6] = childs.join('_')
                        }

                        if ($scope.partnerName) {
                            var partner = "?&from=" + $scope.partnerName + "&utm_source=" + $scope.partnerName + "&utm_medium=affiliate&utm_campaign=" + $scope.toId
                        } else {
                            var partner = ''
                        }


                        if (!$scope.fromToEqual && innaSearchForm.$valid == true) {
                            //?&from=[идентификатор партнера]&utm_source=[идентификатор партнера]&utm_medium=affiliate&utm_campaign=[страна направления куда]"
                            window.open($scope.partnerSite + "/#/packages/search/" + params.join('-') + partner, '_blank')
                        }
                    } catch (e) {
                        if ($scope.hasOwnProperty(e.message)) {
                            $scope[e.message] = e;
                        }
                    }
                }


                /**
                 * BEGIN validates
                 */
                function validate() {
                    Validators.required($scope.fromId, Error('fromId'), "Введите город отправления");
                    Validators.required($scope.toId, Error('toId'), "Введите город или страну, куда планируете поехать");
                    Validators.noEqual($scope.fromId, $scope.toId, Error('toId'), "Города отправления и назначения должны отличаться");

                    Validators.required($scope.startDate, Error('startDateError'), "Выберите дату отправления туда");
                    Validators.required($scope.endDate, Error('endDateError'), "Выберите дату отправления обратно");

                };
                $scope.$watch('fromId', function (value) {
                    if (value instanceof Error) {
                        $scope.fromIdError = value.text;
                    }
                });
                $scope.$watch('toId', function (value) {
                    if (value instanceof Error) {
                        $scope.toIdError = value.text;
                    }
                });
                $scope.$watch('startDateError', function (value) {
                    if (value instanceof Error) {
                        $scope.startDateError = value.text;
                    }
                });
                $scope.$watch('endDateError', function (value) {
                    if (value instanceof Error) {
                        $scope.endDateError = value.text;
                    }
                });


                /**
                 * END validates
                 */

            }]
        }
    })


    .directive('counterPeople', function ($templateCache) {
        return {
            template: $templateCache.get('search/tpl/counter_people.html'),
            scope: {
                adultCount: '=',
                childrenCount: '=',
                childrensAge: '='
            },
            controller: ['$scope', function ($scope) {
                /*Properties*/
                $scope.isOpen = false;

                /*Events*/
                $scope.onCounterClick = function (model, count) {
                    $scope[model] = count;
                    if (model == 'childrenCount') {
                        $scope.childrensAge = [];
                        for (var i = 0; i < $scope.childrenCount; i++) {
                            $scope.childrensAge.push({value: 0});
                        }
                    }
                }

                $scope.onAgeSelectorClick = function (num) {
                    var selector = $scope.childrensAge[num];
                    selector.isOpen = !selector.isOpen;
                }

                $scope.sum = function (a, b) {
                    return +a + +b;
                }
            }],
            link: function (scope, element, attrs) {
                scope.rootElement = $('.search-form-item-current', element);

                $(document).click(function bodyClick(event) {
                    var isInsideComponent = !!$(event.target).closest(element).length;
                    var isOnComponentTitle = event.target == element || event.target == scope.rootElement[0];

                    scope.$apply(function ($scope) {
                        if (isOnComponentTitle) {
                            $scope.isOpen = !$scope.isOpen;
                        } else {
                            $scope.isOpen = isInsideComponent;
                        }
                    });
                });
            }
        }
    })

    .directive('counterPeopleChildAgeSelector', function ($templateCache) {
        return {
            template: $templateCache.get('search/tpl/counter_people.subcomponent.html'),
            replace: true,
            scope: {
                'selector': '='
            },
            controller: ['$scope', function ($scope) {
                $scope.onChoose = function (age) {
                    $scope.selector.value = age;
                }
            }],
            requires: '^counterPeople'
        }
    })

    .directive('errorTooltip', function ($templateCache, $timeout) {
        return {
            replace: true,
            template: $templateCache.get("search/tpl/error-tooltip.html"),
            scope: {
                error: '@'
            },
            link: function ($scope, element) {

                $scope.$watch('error', function (newValue) {
                    if (newValue != '') {
                        $timeout(function () {
                            var width = element.width();
                            element.css({
                                marginLeft: -width / 2 - 10
                            });
                        }, 0)
                    }
                });
            }
        }
    });
