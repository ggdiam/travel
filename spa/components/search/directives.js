appComponents


    .directive('searchForm', function ($templateCache) {
        return {
            restrict: 'E',
            template: $templateCache.get('search/tpl/form.html'),
            scope: {
                partnerSite: "@",
                partnerName: "@",
                partnerDefaultCity: "@",
                searchParams: "=searchParams"
            },
            controller: function ($element, $scope, SearchServices, $state) {


                $scope.search = {};
                $scope.search.adultCount = 2;


                /**
                 * установка текущей локации
                 */
                SearchServices.getCurrentLocation($scope.partnerDefaultCity)
                    .then(function (res) {
                        $scope.search.fromId = res;
                    });


                /**
                 * Выбор места вылета
                 */
                $scope.getLocationFrom = function (val) {
                    return SearchServices.getLocationFrom(val)
                        .then(function (data) {
                            return data;
                        })
                };


                /**
                 * автокомплит выбора локации назначения
                 * @param val
                 * @returns {*}
                 */
                $scope.getLocationTo = function (val) {
                    return SearchServices.getLocationHotel(val)
                        .then(function (data) {
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
                    if ($scope.search.startDate == $scope.search.endDate) {
                        oneDay = $scope.search.startDate;
                    }

                    if (dates == oneDay) {
                        return {
                            classes: 'one_date'
                        };
                    } else {
                        if (dates == $scope.search.startDate) {
                            return {
                                classes: 'from_date'
                            };
                        }
                        if (dates == $scope.search.endDate) {
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
                 * startSearch
                 */
                $scope.startSearch = function (form) {
                    $state.go("result", {
                        fromId: $scope.search.fromId.id,
                        toId: $scope.search.toId.id,
                        startDate: $scope.search.startDate,
                        endDate: $scope.search.endDate,
                        adultCount: $scope.search.adultCount
                    });
                }


            }
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
