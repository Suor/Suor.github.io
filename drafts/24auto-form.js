// Car form
$('h3.flexform_group__title').text('Generic Info');
$('#l_city').text('City');
$('#f_city [selected]').text('Krasnoyarsk');
$('#l_model_lookup').text('Model lookup');
$('#l_brand').text('Brand');
$('#l_model').text('Model');
$('#line_model [selected]').text('Choose a brand');
$('#line_model .flexform_line__help').text('Choose a model or use a lookup field')

$('#l_year_made').text('Year made')
$('#f_year_made').removeClass('small');
$('#g_production_month').hide()
$('#line_production_month_year_made .flexform_line__help').text('Enter a number')
$('#g_year_made').contents().each(function() {
    if (this.nodeType == 3) this.remove();
});

$('#line_registration_month_registration_year').hide()
$('#line_owner_count').hide()

$('#l_time_used').text('Time used')
$('#line_time_used .flexform_line__help').text('A period last owner used a car')

// car form price
$('h3.flexform_group__title').text('Terms');
$('#line_price .flexform_line__help').text('A price in rubles (digits only)')

$('#l_price').text('Price')
$('#g_haggle label').contents().each(function () {
    if (this.nodeType == 3) this.data = 'Negotiable';
})

$('#l_exchange').text('Exchange');
$('label[for=f_exchange_0').contents().each(function () {
    if (this.nodeType == 3) this.data = 'Not interested';
})
$('label[for=f_exchange_1').contents().each(function () {
    if (this.nodeType == 3) this.data = 'To a car';
})
$('label[for=f_exchange_2').contents().each(function () {
    if (this.nodeType == 3) this.data = 'To other';
})

// car exchange
$('#l_exchange_condition').text('Terms of exchange')
$('#f_exchange_condition [value=1]').text('no extra payment')
$('#f_exchange_condition [value=2]').text('I pay extra')
$('#f_exchange_condition [value=3]').text('I want extra')
// $('#l_exchange_money').text('Terms of exchange')

$('#g_exchange_money').contents().each(function () {
    if (this.nodeType == 3) this.remove();
})

$('.button-big').text('Sell a car')


// unbind and resetup
$('input, :input').unbind();

setupForm(
        '#board-form',
        FORM_FIELDS_DATA,
        [{"aliases": ["city_id"],"required": "Выберите город","name": "city","clean": (function (){
    var int = function (x) {
        return x * 1;
    },
        re = {"sub": function (re, to, s) {
        return s.replace(new RegExp(re, "g"), to);
    }};

    return function (value) {
        return int(re.sub("\\s+", "", value));
    }
}()),"computed": {"choices": {"depends": ["region"],"f": function (self, data) {
    if (self.region_code) {
    return data["cities_by_region"][self.region_code];
}
return data["cities"];

}
}}}, {"required": "Required field","name": "user_is_board_agent","clean": function (value) {
    return ((value != "False") && (value != ""));
}}, {"name": "model_lookup","clean": function (value) {
    return value;
}}, {"required": "Required field","name": "brand","clean": (function (){
    var int = function (x) {
        return x * 1;
    },
        re = {"sub": function (re, to, s) {
        return s.replace(new RegExp(re, "g"), to);
    }};

    return function (value) {
        return int(re.sub("\\s+", "", value));
    }
}()),"aliases": ["brand_id"]}, {"computed": {"choices": {"depends": ["brand"],"f": function (self, data) {
    if (self.brand_id) {
    return data["brand_models"][self.brand_id];
}
return [["", "Choose a brand"]];

}
}},"required": "Choose a model or use a lookup field","name": "model","clean": (function (){
    var int = function (x) {
        return x * 1;
    },
        re = {"sub": function (re, to, s) {
        return s.replace(new RegExp(re, "g"), to);
    }};

    return function (value) {
        return int(re.sub("\\s+", "", value));
    }
}()),"help_text": "Choose a model or use a lookup field","aliases": ["model_id"]}, {"name": "production_month","clean": (function (){
    var int = function (x) {
        return x * 1;
    },
        re = {"sub": function (re, to, s) {
        return s.replace(new RegExp(re, "g"), to);
    }};

    return function (value) {
        return int(re.sub("\\s+", "", value));
    }
}())}, {"name": "year_made","rules": [{"test": (function (){
    var test = (function (){
        var CURRENT_YEAR = 2015;

        return function (value) {
            return (1900 < value) && (value <= CURRENT_YEAR);
        }
    }()),
        getattr = function (obj, attr, fallback) {
        return (obj && (attr in obj)) ? obj[attr] : fallback;
    },
        field_name = "year_made";

    return function (self) {
        return test(getattr(self, field_name));
    }
}()),"text": "Укажите настоящий год выпуска","type": "rule","js": true}],"required": "Укажите год выпуска","raw": [{"test": (function (){
    var test = (function (){
        var func = (function (){
            var re_test = (function (){
                var re_tester = function (re) {
                    return function (s) {
                        return new RegExp(re).test(s);
                    }
                };

                return function (regex, s, flags) {
                    return re_tester(regex, flags)(s);

                }

            }()),
                pattern = "^\\s*\\d*[\\s\\d]*$";

            return function (value) {
                return (!value || re_test(pattern, value));
            }
        }());

        return function (raw_value) {
            return func(raw_value);
        }
    }()),
        field_name = "year_made";

    return function (raw) {
        return test(raw[field_name]);
    }
}()),"text": "Введите целое число","type": "raw","js": true}, {"test": (function (){
    var test = (function (){
        var func = (function (){
            var re_test = (function (){
                var re_tester = function (re) {
                    return function (s) {
                        return new RegExp(re).test(s);
                    }
                };

                return function (regex, s, flags) {
                    return re_tester(regex, flags)(s);

                }

            }()),
                pattern = "^\\D*\\d{4}\\D*$";

            return function (value) {
                return (value && re_test(pattern, value));
            }
        }());

        return function (raw_value) {
            return func(raw_value);
        }
    }()),
        field_name = "year_made";

    return function (raw) {
        return test(raw[field_name]);
    }
}()),"text": "Укажите год 4-мя цифрами","type": "raw","js": true}],"clean": (function (){
    var int = function (x) {
        return x * 1;
    },
        re = {"sub": function (re, to, s) {
        return s.replace(new RegExp(re, "g"), to);
    }};

    return function (value) {
        return int(re.sub("\\s+", "", value));
    }
}()),"help_text": "Год указывать только 4-мя цифрами"}, {"computed": {"choices": {"depends": ["inspection_validity_year"],"f": (function (){
    var getattr = function (obj, attr, fallback) {
        return (obj && (attr in obj)) ? obj[attr] : fallback;
    },
        field_name = "inspection_validity_year",
        MONTHS_UNTIL_CURRENT = [["", "..."], [1, "Январь"], [2, "Февраль"], [3, "Март"], [4, "Апрель"]],
        MONTH_CHOICES = [[1, "Январь"], [2, "Февраль"], [3, "Март"], [4, "Апрель"], [5, "Май"], [6, "Июнь"], [7, "Июль"], [8, "Август"], [9, "Сентябрь"], [10, "Октябрь"], [11, "Ноябрь"], [12, "Декабрь"]],
        CURRENT_YEAR = 2015;

    return function (self, data) {

    var field = (getattr(self, field_name) || 0);
    if ((field - CURRENT_YEAR == 2)) {
        return MONTHS_UNTIL_CURRENT;
    }
    return MONTH_CHOICES;
    return null;

    }

}())}},"clean": (function (){
    var int = function (x) {
        return x * 1;
    },
        re = {"sub": function (re, to, s) {
        return s.replace(new RegExp(re, "g"), to);
    }};

    return function (value) {
        return int(re.sub("\\s+", "", value));
    }
}()),"name": "inspection_validity_month"}, {"name": "inspection_validity_year","clean": (function (){
    var int = function (x) {
        return x * 1;
    },
        re = {"sub": function (re, to, s) {
        return s.replace(new RegExp(re, "g"), to);
    }};

    return function (value) {
        return int(re.sub("\\s+", "", value));
    }
}())}, {"name": "registration_month","clean": (function (){
    var int = function (x) {
        return x * 1;
    },
        re = {"sub": function (re, to, s) {
        return s.replace(new RegExp(re, "g"), to);
    }};

    return function (value) {
        return int(re.sub("\\s+", "", value));
    }
}())}, {"help_text": "Укажите дату первой регистрации автомобиля по ПТС","raw": [{"test": (function (){
    var test = (function (){
        var func = (function (){
            var re_test = (function (){
                var re_tester = function (re) {
                    return function (s) {
                        return new RegExp(re).test(s);
                    }
                };

                return function (regex, s, flags) {
                    return re_tester(regex, flags)(s);

                }

            }()),
                pattern = "^\\s*\\d*[\\s\\d]*$";

            return function (value) {
                return (!value || re_test(pattern, value));
            }
        }());

        return function (raw_value) {
            return func(raw_value);
        }
    }()),
        field_name = "registration_year";

    return function (raw) {
        return test(raw[field_name]);
    }
}()),"text": "Введите целое число","type": "raw","js": true}, {"test": (function (){
    var test = (function (){
        var func = (function (){
            var re_test = (function (){
                var re_tester = function (re) {
                    return function (s) {
                        return new RegExp(re).test(s);
                    }
                };

                return function (regex, s, flags) {
                    return re_tester(regex, flags)(s);

                }

            }()),
                pattern = "^\\D*\\d{4}\\D*$";

            return function (value) {
                return (!value || re_test(pattern, value));
            }
        }());

        return function (raw_value) {
            return func(raw_value);
        }
    }()),
        field_name = "registration_year";

    return function (raw) {
        return test(raw[field_name]);
    }
}()),"text": "Укажите год 4-мя цифрами","type": "raw","js": true}],"rules": [{"test": function (self) {
    return (!self.registration_year || (self.registration_year >= self.year_made));
},"text": "Год начала использования должет быть больше года выпуска","type": "rule","js": true}, {"test": (function (){
    var test = (function (){
        var CURRENT_YEAR = 2015;

        return function (value) {
            return (!value || (1900 < value) && (value <= CURRENT_YEAR));
        }
    }()),
        getattr = function (obj, attr, fallback) {
        return (obj && (attr in obj)) ? obj[attr] : fallback;
    },
        field_name = "registration_year";

    return function (self) {
        return test(getattr(self, field_name));
    }
}()),"text": "Укажите настоящий год выпуска","type": "rule","js": true}],"name": "registration_year","clean": (function (){
    var int = function (x) {
        return x * 1;
    },
        re = {"sub": function (re, to, s) {
        return s.replace(new RegExp(re, "g"), to);
    }};

    return function (value) {
        return int(re.sub("\\s+", "", value));
    }
}())}, {"name": "owner_count","clean": (function (){
    var int = function (x) {
        return x * 1;
    },
        re = {"sub": function (re, to, s) {
        return s.replace(new RegExp(re, "g"), to);
    }};

    return function (value) {
        return int(re.sub("\\s+", "", value));
    }
}())}, {"help_text": "Время использования машины последним владельцем","computed": {"value": {"js_only": true,"depends": ["owner_count"],"f": function (self, data) {
    if (self["time_used"]) {
    return self["time_used"];
}
if ((self["owner_count"] == 1)) {
    return 1;
}
return null;

}
}},"clean": (function (){
    var int = function (x) {
        return x * 1;
    },
        re = {"sub": function (re, to, s) {
        return s.replace(new RegExp(re, "g"), to);
    }};

    return function (value) {
        return int(re.sub("\\s+", "", value));
    }
}()),"name": "time_used"}, {"help_text": "Например, более точное описание модели","name": "model_spec","clean": (function (){
    var string = {"lower": function (s) {
        return s.toLowerCase();
    },"join": function (s, arr) {
        return arr.join(s);
    },"split": function (s, sep) {
        return s.split(sep);
    },"strip": function (s) {
        return s.trim();
    }};

    return function (value) {
        return value ? string.strip(value) : "";
    }
}())}, {"help_text": "Идентификационный номер транспортного средства","rules": [{"test": (function (){
    var test = (function (){
        var re_test = (function (){
            var re_tester = function (re) {
                return function (s) {
                    return new RegExp(re).test(s);
                }
            };

            return function (regex, s, flags) {
                return re_tester(regex, flags)(s);

            }

        }()),
            pattern = "^[0-9a-zA-Z]+$";

        return function (value) {
            return (!value || re_test(pattern, value));
        }
    }()),
        getattr = function (obj, attr, fallback) {
        return (obj && (attr in obj)) ? obj[attr] : fallback;
    },
        field_name = "vin";

    return function (self) {
        return test(getattr(self, field_name));
    }
}()),"text": "Разрешены символы латинского алфавита и арабские цифры","type": "rule","js": true}, {"test": (function (){
    var test = (function (){
        var re_test = (function (){
            var re_tester = function (re) {
                return function (s) {
                    return new RegExp(re).test(s);
                }
            };

            return function (regex, s, flags) {
                return re_tester(regex, flags)(s);

            }

        }()),
            pattern = "^[^ioqIOQ]+$";

        return function (value) {
            return (!value || re_test(pattern, value));
        }
    }()),
        getattr = function (obj, attr, fallback) {
        return (obj && (attr in obj)) ? obj[attr] : fallback;
    },
        field_name = "vin";

    return function (self) {
        return test(getattr(self, field_name));
    }
}()),"text": "Использовать буквы I, O, Q запрещено","type": "rule","js": true}, {"test": (function (){
    var test = (function (){
        var l = 17,
            len = function (s) {
            return s.length;
        };

        return function (value) {
            return (!value || (len(value) == l));
        }
    }()),
        getattr = function (obj, attr, fallback) {
        return (obj && (attr in obj)) ? obj[attr] : fallback;
    },
        field_name = "vin";

    return function (self) {
        return test(getattr(self, field_name));
    }
}()),"text": "Ровно 17 символов","type": "rule","js": true}],"name": "vin","clean": function (value) {
    return value;
}}, {"required": "Укажите наличие","name": "available","clean": function (value) {
    return ((value != "False") && (value != ""));
}}, {"required": "Укажите растаможен ли авто","computed": {"visible": {"depends": ["brand"],"f": function (self, data) {
    return !(self.brand_id in data["domestic_brands"]);

}
}},"clean": function (value) {
    return ((value != "False") && (value != ""));
},"name": "customs_clearance"}, {"help_text": "Пробег указывается в километрах (только цифры)","raw": [{"test": (function (){
    var test = (function (){
        var func = (function (){
            var re_test = (function (){
                var re_tester = function (re) {
                    return function (s) {
                        return new RegExp(re).test(s);
                    }
                };

                return function (regex, s, flags) {
                    return re_tester(regex, flags)(s);

                }

            }()),
                pattern = "^\\s*\\d*[\\s\\d]*$";

            return function (value) {
                return (!value || re_test(pattern, value));
            }
        }());

        return function (raw_value) {
            return func(raw_value);
        }
    }()),
        field_name = "run";

    return function (raw) {
        return test(raw[field_name]);
    }
}()),"text": "Введите целое число","type": "raw","js": true}],"rules": [{"test": (function (){
    var test = (function (){
        var other = 5000000,
            op = function (x, y) {
            return (x <= y);
        };

        return function (value) {
            return op(value, other);
        }
    }()),
        getattr = function (obj, attr, fallback) {
        return (obj && (attr in obj)) ? obj[attr] : fallback;
    },
        field_name = "run";

    return function (self) {
        return test(getattr(self, field_name));
    }
}()),"text": "Укажите адекватный пробег","type": "rule","js": true}],"name": "run","clean": (function (){
    var int = function (x) {
        return x * 1;
    },
        re = {"sub": function (re, to, s) {
        return s.replace(new RegExp(re, "g"), to);
    }};

    return function (value) {
        return int(re.sub("\\s+", "", value));
    }
}())}, {"name": "nosmoking_owner","clean": function (x) {
    return !!x;
}}, {"name": "warranty","clean": function (x) {
    return !!x;
}}, {"name": "service_history","clean": function (x) {
    return !!x;
}}, {"required": "Required field","name": "disabilities","clean": function (x) {
    return !!x;
}}, {"name": "roadworthy","clean": function (x) {
    return !!x;
}}, {"name": "accident","clean": function (x) {
    return !!x;
}}, {"required": "Required field","name": "crashed","clean": function (x) {
    return !!x;
}}, {"required": "Опишите повреждения","computed": {"visible": {"depends": ["crashed"],"f": function (self, data) {
    return self.crashed;

}
}},"clean": (function (){
    var string = {"lower": function (s) {
        return s.toLowerCase();
    },"join": function (s, arr) {
        return arr.join(s);
    },"split": function (s, sep) {
        return s.split(sep);
    },"strip": function (s) {
        return s.trim();
    }};

    return function (value) {
        return value ? string.strip(value) : "";
    }
}()),"name": "damages"}, {"required": "Выберите тип двигателя","computed": {"choices": {"depends": ["model"],"f": (function (){
    var map = function (f, seq) {
        return seq.map(f);
    },
        _data = (function (){
        var MODEL_DATA_IDX = 1,
            field_index = 0;

        return function (data, self) {
            return data["models_data"][MODEL_DATA_IDX][self.model_id][field_index];
        }
    }()),
        _choices = (function (){
        var MODEL_CHOICES_IDX = 0,
            field_index = 0;

        return function (data) {
            return data["models_data"][MODEL_CHOICES_IDX][field_index];
        }
    }()),
        _has_model_data = (function (){
        var MODEL_DATA_IDX = 1;

        return function (data, self) {
            return (self.model_id && (self.model_id in data["models_data"][MODEL_DATA_IDX]));
        }
    }());

    return function (self, data) {
        return _has_model_data(data, self) ? map(function (i) {
        return _choices(data)[i]}, _data(data, self)) : self.model_id ? _choices(data) : [["", "Заполните поле Модель"]];
    }
}())}},"clean": function (value) {
    return value;
},"name": "engine"}, {"name": "engine_turbo","clean": function (x) {
    return !!x;
}}, {"help_text": "Например: 3S-FE, RB20DE, B16A","name": "engine_model","clean": function (value) {
    return value;
}}, {"rules": [{"test": (function (){
    var test = (function (){
        var other = 5000,
            op = function (x, y) {
            return (x <= y);
        };

        return function (value) {
            return op(value, other);
        }
    }()),
        getattr = function (obj, attr, fallback) {
        return (obj && (attr in obj)) ? obj[attr] : fallback;
    },
        field_name = "engine_power";

    return function (self) {
        return test(getattr(self, field_name));
    }
}()),"text": "Укажите настоящую мощность","type": "rule","js": true}],"raw": [{"test": (function (){
    var test = (function (){
        var func = (function (){
            var re_test = (function (){
                var re_tester = function (re) {
                    return function (s) {
                        return new RegExp(re).test(s);
                    }
                };

                return function (regex, s, flags) {
                    return re_tester(regex, flags)(s);

                }

            }()),
                pattern = "^\\s*\\d*[\\s\\d]*$";

            return function (value) {
                return (!value || re_test(pattern, value));
            }
        }());

        return function (raw_value) {
            return func(raw_value);
        }
    }()),
        field_name = "engine_power";

    return function (raw) {
        return test(raw[field_name]);
    }
}()),"text": "Введите целое число","type": "raw","js": true}],"name": "engine_power","clean": (function (){
    var int = function (x) {
        return x * 1;
    },
        re = {"sub": function (re, to, s) {
        return s.replace(new RegExp(re, "g"), to);
    }};

    return function (value) {
        return int(re.sub("\\s+", "", value));
    }
}())}, {"required": "Выберите тип топлива","computed": {"choices": {"depends": ["model"],"f": (function (){
    var map = function (f, seq) {
        return seq.map(f);
    },
        _data = (function (){
        var MODEL_DATA_IDX = 1,
            field_index = 1;

        return function (data, self) {
            return data["models_data"][MODEL_DATA_IDX][self.model_id][field_index];
        }
    }()),
        _choices = (function (){
        var MODEL_CHOICES_IDX = 0,
            field_index = 1;

        return function (data) {
            return data["models_data"][MODEL_CHOICES_IDX][field_index];
        }
    }()),
        _has_model_data = (function (){
        var MODEL_DATA_IDX = 1;

        return function (data, self) {
            return (self.model_id && (self.model_id in data["models_data"][MODEL_DATA_IDX]));
        }
    }());

    return function (self, data) {
        return _has_model_data(data, self) ? map(function (i) {
        return _choices(data)[i]}, _data(data, self)) : self.model_id ? _choices(data) : [["", "Заполните поле Модель"]];
    }
}())}},"clean": (function (){
    var int = function (x) {
        return x * 1;
    },
        re = {"sub": function (re, to, s) {
        return s.replace(new RegExp(re, "g"), to);
    }};

    return function (value) {
        return int(re.sub("\\s+", "", value));
    }
}()),"name": "engine_fuel"}, {"rules": [{"test": (function (){
    var test = function (value) {
        return (value <= 100);
    },
        getattr = function (obj, attr, fallback) {
        return (obj && (attr in obj)) ? obj[attr] : fallback;
    },
        field_name = "fuel_rate_from";

    return function (self) {
        return test(getattr(self, field_name));
    }
}()),"text": "Укажите реальное значение от","type": "rule","js": true}],"raw": [{"test": (function (){
    var test = (function (){
        var func = (function (){
            var re_test = (function (){
                var re_tester = function (re) {
                    return function (s) {
                        return new RegExp(re).test(s);
                    }
                };

                return function (regex, s, flags) {
                    return re_tester(regex, flags)(s);

                }

            }()),
                pattern = "^\\s*\\d*([.,]\\d+)?$";

            return function (value) {
                return (!value || re_test(pattern, value));
            }
        }());

        return function (raw_value) {
            return func(raw_value);
        }
    }()),
        field_name = "fuel_rate_from";

    return function (raw) {
        return test(raw[field_name]);
    }
}()),"text": "Введите число","type": "raw","js": true}],"required": "Укажите значение от","name": "fuel_rate_from","clean": (function (){
    var float = function (x) {
        return x * 1;
    };

    return function (value) {
        return float(value.replace(",", "."));
    }
}())}, {"rules": [{"test": function (self) {
    return (self.fuel_rate_to >= self.fuel_rate_from);
},"text": "Максимальный расход не может быть меньше минимального","type": "rule","js": true}, {"test": (function (){
    var test = function (value) {
        return (value <= 100);
    },
        getattr = function (obj, attr, fallback) {
        return (obj && (attr in obj)) ? obj[attr] : fallback;
    },
        field_name = "fuel_rate_to";

    return function (self) {
        return test(getattr(self, field_name));
    }
}()),"text": "Укажите реальное значение до","type": "rule","js": true}],"raw": [{"test": (function (){
    var test = (function (){
        var func = (function (){
            var re_test = (function (){
                var re_tester = function (re) {
                    return function (s) {
                        return new RegExp(re).test(s);
                    }
                };

                return function (regex, s, flags) {
                    return re_tester(regex, flags)(s);

                }

            }()),
                pattern = "^\\s*\\d*([.,]\\d+)?$";

            return function (value) {
                return (!value || re_test(pattern, value));
            }
        }());

        return function (raw_value) {
            return func(raw_value);
        }
    }()),
        field_name = "fuel_rate_to";

    return function (raw) {
        return test(raw[field_name]);
    }
}()),"text": "Введите число","type": "raw","js": true}],"required": "Укажите значение до","name": "fuel_rate_to","clean": (function (){
    var float = function (x) {
        return x * 1;
    };

    return function (value) {
        return float(value.replace(",", "."));
    }
}())}, {"required": "Выберите тип КПП","computed": {"choices": {"depends": ["model"],"f": (function (){
    var map = function (f, seq) {
        return seq.map(f);
    },
        _data = (function (){
        var MODEL_DATA_IDX = 1,
            field_index = 4;

        return function (data, self) {
            return data["models_data"][MODEL_DATA_IDX][self.model_id][field_index];
        }
    }()),
        _choices = (function (){
        var MODEL_CHOICES_IDX = 0,
            field_index = 4;

        return function (data) {
            return data["models_data"][MODEL_CHOICES_IDX][field_index];
        }
    }()),
        _has_model_data = (function (){
        var MODEL_DATA_IDX = 1;

        return function (data, self) {
            return (self.model_id && (self.model_id in data["models_data"][MODEL_DATA_IDX]));
        }
    }());

    return function (self, data) {
        return _has_model_data(data, self) ? map(function (i) {
        return _choices(data)[i]}, _data(data, self)) : self.model_id ? _choices(data) : [["", "Заполните поле Модель"]];
    }
}())}},"clean": (function (){
    var int = function (x) {
        return x * 1;
    },
        re = {"sub": function (re, to, s) {
        return s.replace(new RegExp(re, "g"), to);
    }};

    return function (value) {
        return int(re.sub("\\s+", "", value));
    }
}()),"name": "transmission"}, {"required": "Выберите тип привода","computed": {"choices": {"depends": ["model"],"f": (function (){
    var map = function (f, seq) {
        return seq.map(f);
    },
        _data = (function (){
        var MODEL_DATA_IDX = 1,
            field_index = 3;

        return function (data, self) {
            return data["models_data"][MODEL_DATA_IDX][self.model_id][field_index];
        }
    }()),
        _choices = (function (){
        var MODEL_CHOICES_IDX = 0,
            field_index = 3;

        return function (data) {
            return data["models_data"][MODEL_CHOICES_IDX][field_index];
        }
    }()),
        _has_model_data = (function (){
        var MODEL_DATA_IDX = 1;

        return function (data, self) {
            return (self.model_id && (self.model_id in data["models_data"][MODEL_DATA_IDX]));
        }
    }());

    return function (self, data) {
        return _has_model_data(data, self) ? map(function (i) {
        return _choices(data)[i]}, _data(data, self)) : self.model_id ? _choices(data) : [["", "Заполните поле Модель"]];
    }
}())}},"clean": (function (){
    var int = function (x) {
        return x * 1;
    },
        re = {"sub": function (re, to, s) {
        return s.replace(new RegExp(re, "g"), to);
    }};

    return function (value) {
        return int(re.sub("\\s+", "", value));
    }
}()),"name": "gear"}, {"help_text": "Укажите дорожный просвет в сантиметрах","raw": [{"test": (function (){
    var test = (function (){
        var func = (function (){
            var re_test = (function (){
                var re_tester = function (re) {
                    return function (s) {
                        return new RegExp(re).test(s);
                    }
                };

                return function (regex, s, flags) {
                    return re_tester(regex, flags)(s);

                }

            }()),
                pattern = "^\\s*\\d*[\\s\\d]*$";

            return function (value) {
                return (!value || re_test(pattern, value));
            }
        }());

        return function (raw_value) {
            return func(raw_value);
        }
    }()),
        field_name = "clearance";

    return function (raw) {
        return test(raw[field_name]);
    }
}()),"text": "Введите целое число","type": "raw","js": true}],"rules": [{"test": (function (){
    var test = (function (){
        var other = 100,
            op = function (x, y) {
            return (x < y);
        };

        return function (value) {
            return op(value, other);
        }
    }()),
        getattr = function (obj, attr, fallback) {
        return (obj && (attr in obj)) ? obj[attr] : fallback;
    },
        field_name = "clearance";

    return function (self) {
        return test(getattr(self, field_name));
    }
}()),"text": "Укажите реальнное значение","type": "rule","js": true}],"name": "clearance","clean": (function (){
    var int = function (x) {
        return x * 1;
    },
        re = {"sub": function (re, to, s) {
        return s.replace(new RegExp(re, "g"), to);
    }};

    return function (value) {
        return int(re.sub("\\s+", "", value));
    }
}())}, {"required": "Выберите тип кузова","computed": {"choices": {"depends": ["model"],"f": (function (){
    var map = function (f, seq) {
        return seq.map(f);
    },
        _data = (function (){
        var MODEL_DATA_IDX = 1,
            field_index = 2;

        return function (data, self) {
            return data["models_data"][MODEL_DATA_IDX][self.model_id][field_index];
        }
    }()),
        _choices = (function (){
        var MODEL_CHOICES_IDX = 0,
            field_index = 2;

        return function (data) {
            return data["models_data"][MODEL_CHOICES_IDX][field_index];
        }
    }()),
        _has_model_data = (function (){
        var MODEL_DATA_IDX = 1;

        return function (data, self) {
            return (self.model_id && (self.model_id in data["models_data"][MODEL_DATA_IDX]));
        }
    }());

    return function (self, data) {
        return _has_model_data(data, self) ? map(function (i) {
        return _choices(data)[i]}, _data(data, self)) : self.model_id ? _choices(data) : [["", "Заполните поле Модель"]];
    }
}())}},"clean": (function (){
    var int = function (x) {
        return x * 1;
    },
        re = {"sub": function (re, to, s) {
        return s.replace(new RegExp(re, "g"), to);
    }};

    return function (value) {
        return int(re.sub("\\s+", "", value));
    }
}()),"name": "body_type"}, {"help_text": "Например: ST215G, HR34, EG4","name": "body_model","clean": function (value) {
    return value;
}}, {"computed": {"choices": {"depends": ["body_type"],"f": (function (){
    var unicode = function (x) {
        return x.toString();
    };

    return function (self, data) {

    var body_key = unicode(self.body_type);

    var model_key = unicode(self.model_id);
    if ((self.body_type && ((model_key in data["body_doors"]) && (body_key in data["body_doors"][model_key])))) {
        return data["body_doors"][model_key][body_key];
    }
    return [["", "Выберите тип кузова"]];

    }

}())}},"rules": [{"test": (function (){
    var test = (function (){
        var other = 10,
            op = function (x, y) {
            return (x <= y);
        };

        return function (value) {
            return op(value, other);
        }
    }()),
        getattr = function (obj, attr, fallback) {
        return (obj && (attr in obj)) ? obj[attr] : fallback;
    },
        field_name = "body_doors";

    return function (self) {
        return test(getattr(self, field_name));
    }
}()),"text": "Укажите настоящее число дверей","type": "rule","js": true}],"required": "Укажите число дверей","raw": [{"test": (function (){
    var test = (function (){
        var func = (function (){
            var re_test = (function (){
                var re_tester = function (re) {
                    return function (s) {
                        return new RegExp(re).test(s);
                    }
                };

                return function (regex, s, flags) {
                    return re_tester(regex, flags)(s);

                }

            }()),
                pattern = "^\\s*\\d*[\\s\\d]*$";

            return function (value) {
                return (!value || re_test(pattern, value));
            }
        }());

        return function (raw_value) {
            return func(raw_value);
        }
    }()),
        field_name = "body_doors";

    return function (raw) {
        return test(raw[field_name]);
    }
}()),"text": "Введите целое число","type": "raw","js": true}],"clean": (function (){
    var int = function (x) {
        return x * 1;
    },
        re = {"sub": function (re, to, s) {
        return s.replace(new RegExp(re, "g"), to);
    }};

    return function (value) {
        return int(re.sub("\\s+", "", value));
    }
}()),"name": "body_doors"}, {"rules": [{"test": (function (){
    var test = (function (){
        var other = 80,
            op = function (x, y) {
            return (x < y);
        };

        return function (value) {
            return op(value, other);
        }
    }()),
        getattr = function (obj, attr, fallback) {
        return (obj && (attr in obj)) ? obj[attr] : fallback;
    },
        field_name = "body_places";

    return function (self) {
        return test(getattr(self, field_name));
    }
}()),"text": "Укажите настоящее число мест","type": "rule","js": true}, {"test": (function (){
    var test = (function (){
        var other = 8,
            op = function (x, y) {
            return (x < y);
        };

        return function (value) {
            return op(value, other);
        }
    }()),
        getattr = function (obj, attr, fallback) {
        return (obj && (attr in obj)) ? obj[attr] : fallback;
    },
        field_name = "body_places";

    return function (self) {
        return test(getattr(self, field_name));
    }
}()),"text": "Автобусы размещаются в разделе «Автобусы»","type": "rule","js": true}],"raw": [{"test": (function (){
    var test = (function (){
        var func = (function (){
            var re_test = (function (){
                var re_tester = function (re) {
                    return function (s) {
                        return new RegExp(re).test(s);
                    }
                };

                return function (regex, s, flags) {
                    return re_tester(regex, flags)(s);

                }

            }()),
                pattern = "^\\s*\\d*[\\s\\d]*$";

            return function (value) {
                return (!value || re_test(pattern, value));
            }
        }());

        return function (raw_value) {
            return func(raw_value);
        }
    }()),
        field_name = "body_places";

    return function (raw) {
        return test(raw[field_name]);
    }
}()),"text": "Введите целое число","type": "raw","js": true}],"name": "body_places","clean": (function (){
    var int = function (x) {
        return x * 1;
    },
        re = {"sub": function (re, to, s) {
        return s.replace(new RegExp(re, "g"), to);
    }};

    return function (value) {
        return int(re.sub("\\s+", "", value));
    }
}())}, {"rules": [{"test": (function (){
    var re_test = (function (){
        var re_tester = function (re) {
            return function (s) {
                return new RegExp(re).test(s);
            }
        };

        return function (regex, s, flags) {
            return re_tester(regex, flags)(s);

        }

    }());

    return function (self) {
        return !re_test("\\s*[нН][аА]\\s*[фФ][оО][тТ]", self.color);
    }
}()),"text": "Укажите цвет","type": "rule","js": true}],"required": "Укажите цвет","name": "color","clean": function (value) {
    return value;
}}, {"name": "body_color_metallic","clean": function (x) {
    return !!x;
}}, {"name": "interior_color","clean": function (value) {
    return value;
}}, {"required": "Укажите положение руля","name": "wheel_pos","clean": (function (){
    var int = function (x) {
        return x * 1;
    },
        re = {"sub": function (re, to, s) {
        return s.replace(new RegExp(re, "g"), to);
    }};

    return function (value) {
        return int(re.sub("\\s+", "", value));
    }
}())}, {"name": "trailer_coupling","clean": function (x) {
    return !!x;
}}, {"name": "lightrims","clean": function (x) {
    return !!x;
}}, {"name": "audio_radio","clean": function (x) {
    return !!x;
}}, {"name": "audio_tape","clean": function (x) {
    return !!x;
}}, {"name": "audio_cd","clean": function (x) {
    return !!x;
}}, {"name": "audio_mp3","clean": function (x) {
    return !!x;
}}, {"name": "usb_socket","clean": function (x) {
    return !!x;
}}, {"name": "sd_slot","clean": function (x) {
    return !!x;
}}, {"name": "hdd","clean": function (x) {
    return !!x;
}}, {"name": "onboard_computer","clean": function (x) {
    return !!x;
}}, {"name": "navigator","clean": function (x) {
    return !!x;
}}, {"name": "display","clean": function (x) {
    return !!x;
}}, {"name": "bluetooth","clean": function (x) {
    return !!x;
}}, {"name": "hands_free","clean": function (x) {
    return !!x;
}}, {"name": "electric_windows","clean": function (x) {
    return !!x;
}}, {"name": "electric_mirrors","clean": function (x) {
    return !!x;
}}, {"name": "electric_seats","clean": function (x) {
    return !!x;
}}, {"name": "seat_heating","clean": (function (){
    var int = function (x) {
        return x * 1;
    },
        re = {"sub": function (re, to, s) {
        return s.replace(new RegExp(re, "g"), to);
    }};

    return function (value) {
        return int(re.sub("\\s+", "", value));
    }
}())}, {"name": "light_sensor","clean": function (x) {
    return !!x;
}}, {"name": "rain_sensor","clean": function (x) {
    return !!x;
}}, {"name": "power_steering","clean": function (x) {
    return !!x;
}}, {"name": "multi_steering_wheel","clean": function (x) {
    return !!x;
}}, {"name": "conditioner","clean": (function (){
    var int = function (x) {
        return x * 1;
    },
        re = {"sub": function (re, to, s) {
        return s.replace(new RegExp(re, "g"), to);
    }};

    return function (value) {
        return int(re.sub("\\s+", "", value));
    }
}())}, {"name": "auxiliary_engine_heating","clean": (function (){
    var int = function (x) {
        return x * 1;
    },
        re = {"sub": function (re, to, s) {
        return s.replace(new RegExp(re, "g"), to);
    }};

    return function (value) {
        return int(re.sub("\\s+", "", value));
    }
}())}, {"name": "roof_rack","clean": function (x) {
    return !!x;
}}, {"name": "ski_bag","clean": function (x) {
    return !!x;
}}, {"name": "roof_door","clean": function (x) {
    return !!x;
}}, {"name": "panoramic_roof","clean": function (x) {
    return !!x;
}}, {"name": "toning","clean": function (x) {
    return !!x;
}}, {"name": "interior_design","clean": (function (){
    var int = function (x) {
        return x * 1;
    },
        re = {"sub": function (re, to, s) {
        return s.replace(new RegExp(re, "g"), to);
    }};

    return function (value) {
        return int(re.sub("\\s+", "", value));
    }
}())}, {"name": "absystem","clean": function (x) {
    return !!x;
}}, {"name": "esp","clean": function (x) {
    return !!x;
}}, {"name": "traction_control","clean": function (x) {
    return !!x;
}}, {"name": "cruise_control","clean": function (x) {
    return !!x;
}}, {"name": "headup_display","clean": function (x) {
    return !!x;
}}, {"name": "start_stop_system","clean": function (x) {
    return !!x;
}}, {"name": "active_safety","clean": function (x) {
    return !!x;
}}, {"name": "isofix","clean": function (x) {
    return !!x;
}}, {"name": "airbags","clean": (function (){
    var int = function (x) {
        return x * 1;
    },
        re = {"sub": function (re, to, s) {
        return s.replace(new RegExp(re, "g"), to);
    }};

    return function (value) {
        return int(re.sub("\\s+", "", value));
    }
}())}, {"name": "parking_system","clean": function (value) {
    return value;
}}, {"name": "central_locking","clean": function (x) {
    return !!x;
}}, {"name": "alarm_system","clean": function (x) {
    return !!x;
}}, {"name": "immobilizer","clean": function (x) {
    return !!x;
}}, {"name": "xenon_headlights","clean": function (x) {
    return !!x;
}}, {"name": "adaptive_headlights","clean": function (x) {
    return !!x;
}}, {"name": "fog_lamp","clean": function (x) {
    return !!x;
}}, {"name": "daytime_light","clean": function (x) {
    return !!x;
}}, {"name": "sport_seats","clean": function (x) {
    return !!x;
}}, {"name": "sport_suspension","clean": function (x) {
    return !!x;
}}, {"name": "sport_package","clean": function (x) {
    return !!x;
}}, {"name": "sport_tuning","clean": function (x) {
    return !!x;
}}, {"name": "upgraded","clean": function (x) {
    return !!x;
}}, {"help_text": "Опишите, какие именно доработки были сделаны","required": "Опишите все изменения, которым подвергcя автомобиль","computed": {"visible": {"depends": ["upgraded"],"f": function (self, data) {
    return self.upgraded;

}
}},"clean": (function (){
    var string = {"lower": function (s) {
        return s.toLowerCase();
    },"join": function (s, arr) {
        return arr.join(s);
    },"split": function (s, sep) {
        return s.split(sep);
    },"strip": function (s) {
        return s.trim();
    }};

    return function (value) {
        return value ? string.strip(value) : "";
    }
}()),"name": "upgrades"}, {"help_text": "Нельзя писать номер телефона","name": "description","clean": (function (){
    var string = {"lower": function (s) {
        return s.toLowerCase();
    },"join": function (s, arr) {
        return arr.join(s);
    },"split": function (s, sep) {
        return s.split(sep);
    },"strip": function (s) {
        return s.trim();
    }};

    return function (value) {
        return value ? string.strip(value) : "";
    }
}())}, {"computed": {"type_params": {"depends": ["region"],"f": function (self, data) {
    return {"profile": (self.site_region_code == 24) ? "board_24" : "board", "max_images": 11};

}
}},"name": "photos"}, {"help_text": "Укажите ссылку на ролик на youtube, rutube, video.mail.ru, smotri.com, vimeo.com","rules": [{"test": (function (){
    var test = (function (){
        var l = 255,
            len = function (s) {
            return s.length;
        };

        return function (value) {
            return (len(value) <= l);
        }
    }()),
        getattr = function (obj, attr, fallback) {
        return (obj && (attr in obj)) ? obj[attr] : fallback;
    },
        field_name = "video";

    return function (self) {
        return test(getattr(self, field_name));
    }
}()),"text": "Не более 255 символов","type": "rule","js": true}, {"test": (function (){
    var test = (function (){
        var re_test = (function (){
            var re_tester = function (re) {
                return function (s) {
                    return new RegExp(re).test(s);
                }
            };

            return function (regex, s, flags) {
                return re_tester(regex, flags)(s);

            }

        }()),
            pattern = "^https?://";

        return function (value) {
            return (!value || re_test(pattern, value));
        }
    }()),
        getattr = function (obj, attr, fallback) {
        return (obj && (attr in obj)) ? obj[attr] : fallback;
    },
        field_name = "video";

    return function (self) {
        return test(getattr(self, field_name));
    }
}()),"text": "Введите правильную ссылку","type": "rule","js": true}, {"test": (function (){
    var test = (function (){
        var re_test = (function (){
            var re_tester = function (re) {
                return function (s) {
                    return new RegExp(re).test(s);
                }
            };

            return function (regex, s, flags) {
                return re_tester(regex, flags)(s);

            }

        }()),
            pattern = "my\\.mail\\.ru|smotri\\.com|vimeo\\.com|rutube\\.ru|youtube\\.com";

        return function (value) {
            return (!value || re_test(pattern, value));
        }
    }()),
        getattr = function (obj, attr, fallback) {
        return (obj && (attr in obj)) ? obj[attr] : fallback;
    },
        field_name = "video";

    return function (self) {
        return test(getattr(self, field_name));
    }
}()),"text": "Такой видеохостинг не поддерживается","type": "rule","js": true}, {"test": (function (){
    var test = (function (){
        var re_test = (function (){
            var re_tester = function (re) {
                return function (s) {
                    return new RegExp(re).test(s);
                }
            };

            return function (regex, s, flags) {
                return re_tester(regex, flags)(s);

            }

        }()),
            pattern = "my.mail.ru/[a-zA-Z0-9_\\-\\/]+\\.html$|smotri\\.com/video/view/\\?id\\=[\\w\\d-]+|vimeo\\.com/\\w+|rutube\\.ru/video/[\\d\\w]+|youtube\\.com/watch\\?\\S*?v=[\\w\\-]+";

        return function (value) {
            return (!value || re_test(pattern, value));
        }
    }()),
        getattr = function (obj, attr, fallback) {
        return (obj && (attr in obj)) ? obj[attr] : fallback;
    },
        field_name = "video";

    return function (self) {
        return test(getattr(self, field_name));
    }
}()),"text": "Неправильный формат ссылки","type": "rule","js": true}],"name": "video","clean": (function (){
    var string = {"lower": function (s) {
        return s.toLowerCase();
    },"join": function (s, arr) {
        return arr.join(s);
    },"split": function (s, sep) {
        return s.split(sep);
    },"strip": function (s) {
        return s.trim();
    }};

    return function (value) {
        return value ? string.strip(value) : "";
    }
}())}, {"required": "Укажите телефон","name": "phones","clean": (function (){
    var string = {"lower": function (s) {
        return s.toLowerCase();
    },"join": function (s, arr) {
        return arr.join(s);
    },"split": function (s, sep) {
        return s.split(sep);
    },"strip": function (s) {
        return s.trim();
    }};

    return function (value) {
        return value ? string.split(value, ",") : [];
    }
}())}, {"required": "Required field","name": "allow_questions","clean": function (x) {
    return !!x;
}}, {"name": "price","rules": [{"test": (function (){
    var test = (function (){
        var other = 100000000,
            op = function (x, y) {
            return (x < y);
        };

        return function (value) {
            return op(value, other);
        }
    }()),
        getattr = function (obj, attr, fallback) {
        return (obj && (attr in obj)) ? obj[attr] : fallback;
    },
        field_name = "price";

    return function (self) {
        return test(getattr(self, field_name));
    }
}()),"text": "Specify an adequate price","type": "rule","js": true}, {"test": (function (){
    var test = (function (){
        var other = 1000,
            op = function (x, y) {
            return (x >= y);
        };

        return function (value) {
            return op(value, other);
        }
    }()),
        getattr = function (obj, attr, fallback) {
        return (obj && (attr in obj)) ? obj[attr] : fallback;
    },
        field_name = "price";

    return function (self) {
        return test(getattr(self, field_name));
    }
}()),"text": "Specify a price in rubles, not thousands of rubles","type": "rule","js": true}],"required": "Specify a price","raw": [{"test": (function (){
    var test = (function (){
        var func = (function (){
            var re_test = (function (){
                var re_tester = function (re) {
                    return function (s) {
                        return new RegExp(re).test(s);
                    }
                };

                return function (regex, s, flags) {
                    return re_tester(regex, flags)(s);

                }

            }()),
                pattern = "^\\s*\\d*[\\s\\d]*$";

            return function (value) {
                return (!value || re_test(pattern, value));
            }
        }());

        return function (raw_value) {
            return func(raw_value);
        }
    }()),
        field_name = "price";

    return function (raw) {
        return test(raw[field_name]);
    }
}()),"text": "Enter a number","type": "raw","js": true}],"clean": (function (){
    var int = function (x) {
        return x * 1;
    },
        re = {"sub": function (re, to, s) {
        return s.replace(new RegExp(re, "g"), to);
    }};

    return function (value) {
        return int(re.sub("\\s+", "", value));
    }
}()),"help_text": "Specify a price in rubles (digits only)"}, {"rules": [{"test": function (self) {
    return (!self.haggle || (self.price > 0));
},"text": "Specify a price or uncheck haggle","type": "rule","js": true}],"name": "haggle","clean": function (x) {
    return !!x;
}}, {"required": "Required field","name": "exchange","clean": (function (){
    var int = function (x) {
        return x * 1;
    },
        re = {"sub": function (re, to, s) {
        return s.replace(new RegExp(re, "g"), to);
    }};

    return function (value) {
        return int(re.sub("\\s+", "", value));
    }
}())}, {"computed": {"visible": {"depends": ["exchange"],"f": function (self, data) {
    return (self.exchange == 2);

}
}},"clean": (function (){
    var string = {"lower": function (s) {
        return s.toLowerCase();
    },"join": function (s, arr) {
        return arr.join(s);
    },"split": function (s, sep) {
        return s.split(sep);
    },"strip": function (s) {
        return s.trim();
    }};

    return function (value) {
        return value ? string.strip(value) : "";
    }
}()),"name": "exchange_to"}, {"required": "Выберите условие обмена","computed": {"visible": {"depends": ["exchange"],"f": function (self, data) {
    return (self.exchange == 1);

}
}},"clean": (function (){
    var int = function (x) {
        return x * 1;
    },
        re = {"sub": function (re, to, s) {
        return s.replace(new RegExp(re, "g"), to);
    }};

    return function (value) {
        return int(re.sub("\\s+", "", value));
    }
}()),"name": "exchange_condition"}, {"computed": {"help_text": {"depends": ["exchange_condition"],"f": function (self, data) {
    if ((self.exchange_condition == 2)) {
    return "";
}
return "";

}
},"visible": {"depends": ["exchange_condition"],"f": function (self, data) {
    return ((self.exchange == 1) && ((self.exchange_condition == 2) || (self.exchange_condition == 3)));

}
},"title": {"depends": ["exchange_condition"],"f": function (self, data) {
    if ((self.exchange_condition == 2)) {
    return "Max extra payment";
}
return "Min extra payment";

}
}},"required": "Укажите доплату","raw": [{"test": (function (){
    var test = (function (){
        var func = (function (){
            var re_test = (function (){
                var re_tester = function (re) {
                    return function (s) {
                        return new RegExp(re).test(s);
                    }
                };

                return function (regex, s, flags) {
                    return re_tester(regex, flags)(s);

                }

            }()),
                pattern = "^\\s*\\d*[\\s\\d]*$";

            return function (value) {
                return (!value || re_test(pattern, value));
            }
        }());

        return function (raw_value) {
            return func(raw_value);
        }
    }()),
        field_name = "exchange_money";

    return function (raw) {
        return test(raw[field_name]);
    }
}()),"text": "Введите целое число","type": "raw","js": true}],"clean": (function (){
    var int = function (x) {
        return x * 1;
    },
        re = {"sub": function (re, to, s) {
        return s.replace(new RegExp(re, "g"), to);
    }};

    return function (value) {
        return int(re.sub("\\s+", "", value));
    }
}()),"help_text": "Укажите минимальную сумму, которую хотите получить по обмену","name": "exchange_money"}, {"required": "Выберите модели для обмена","computed": {"visible": {"depends": ["exchange_condition"],"f": function (self, data) {
    return false;

}
}},"clean": function (value) {
    return value;
},"name": "exchange_models"}],
        {"user_id": 209036},
        function (data, getField) {

                (function () {

            var lookup = $.chainedLookup({select: getField("brand"), data: data["brands"]}, {select: getField("model"), data: data["brand_models"]});
            getField("model_lookup").keyup(function () {
                lookup(this.value);
            });

                }());

        }
    );
