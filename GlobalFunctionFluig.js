var acEmpresas = null;
var acSetores = null;
var _mobile = false;

var setMobile = function (mobile) {
    _mobile = mobile;
}

var setMessage = function (type, message) {
    FLUIGC.toast({
        type: type,
        message: message,
        timeout: 10000,
    });
};

function autocompleteEmpresas(settings) {
    // Configurações padrão que podem ser sobrescritas
    var config = $.extend({
        empresaField: "#nomeEmpresaSolicitante",  // Campo de input de autocomplete
        codEmpVariavel: "#codEmpresaSolicitante", // Campo que armazena o código da empresa
        codSetorField: "#codSetorSolicitante",    // Campo para armazenar o código do setor
        setorField: "#nomeSetorSolicitante",      // Campo do nome do setor
        mensagemErro: "A empresa já está selecionada!",  // Mensagem de erro padrão
        maxTags: 1,  // Limite de tags
        urlBase: "/api/public/2.0/groups/findGroupsByUser/",  // URL base para a API
        codigoSolicitante: "#codSolicitante",  // ID do solicitante
        readOnly: false,  // Define se o campo será readonly
        addConfigSelectEmpresa: function () { },  // Callback adicional ao selecionar empresa
        addConfigRemoveEmpresa: function () { },  // Callback adicional ao remover empresa
        selectEmpresa: function (event) {  // Função padrão ao adicionar item
            var filial = event.item.code.split("_")[0];
            $(config.codEmpVariavel).val(filial);
            autocompleteSetores();
            config.addConfigSelectEmpresa();
        },
        removeEmpresa: function (event) {  // Função padrão ao remover item
            $(config.codEmpVariavel).val("");
            $(config.codSetorField).val("");
            $(config.setorField).val("");
            config.addConfigRemoveEmpresa();
        }
    }, settings);

    // Definir campo como editável ou readonly conforme a configuração
    $(config.empresaField).prop("readonly", config.readOnly);

    // Configuração do autocomplete
    acEmpresas = FLUIGC.autocomplete(config.empresaField, {
        highlight: true,
        minLength: 0,
        hint: true,
        searchTimeout: 100,
        type: "tagAutocomplete",
        name: "empresa",
        tagClass: "tag-default",
        maxTags: config.maxTags,
        allowDuplicates: false,
        onTagExists: function (item, tag) {
            // Exibe a mensagem de erro definida no JSON
            setMessage("warning", config.mensagemErro);
            $(tag).hide().fadeIn();
        },
        onMaxTags: function () {
            setMessage("warning", "Você atingiu o limite de empresas!");

        },
        displayKey: "description",
        source: {
            url: config.urlBase + $(config.codigoSolicitante).val() + "?pattern=0&",
            limit: 10,
            offset: 0,
            formatData: function (data) {
                return data.content.filter(function (group) {
                    return !group.isInternal;
                });
            },
        },
    })
        .on("fluig.autocomplete.itemAdded", function (event) {
            config.selectEmpresa(event);
        })
        .on("fluig.autocomplete.itemRemoved", function (event) {
            config.removeEmpresa(event);
        });

    return acEmpresas
}

function autocompleteSetores(settings) {
   
    
    // Configurações padrão que podem ser sobrescritas
    var config = $.extend({
        codSetorField: "#codSetorSolicitante",    // Campo para armazenar o código do setor
        setorField: "#nomeSetorSolicitante",      // Campo do nome do setor
        codigoSolicitante: "#codSolicitante",         // ID do campo solicitante
        maxTags: 1,  // Limite de tags
        onItemAdded: function (event) {
            $(config.codSetorField).val(event.item.COD_PROTHEUS);
        },
        onItemRemoved: function () {
            $(config.codSetorField).val("");
        }
    }, settings);
  
    

    // Definir campo como editável ou readonly conforme a configuração
    $(config.setorField).prop("readonly", false);

    // Função para buscar correspondências
    function substringMatcher(list, campo) {
        return function findMatches(q, cb) {
            var matches = [];
            var substrRegex = new RegExp(q, "i");
            $.each(list, function (i, item) {
                if (substrRegex.test(item[campo])) {
                    matches.push(item);
                }
            });
            cb(matches);
        };
    }

    // Função para buscar os setores do dataset
    const getSetores = (codeUser) => {
        return $.ajax({
            url: `/api/public/ecm/dataset/search?datasetId=dsSetoresUsuario&filterFields=user,${codeUser}`,
            type: 'GET',
        })
            .then((data) => {
                if (data && data.content.length > 0) {
                    if (data.content[0].ERROR) {
                        setMessage("warning", "Não foi possível encontrar um setor.");
                        return [];
                    }
                    return data.content;
                } else {
                    setMessage("warning", "Não foi possível encontrar um setor.");
                    return [];
                }
            })
            .catch((jqXHR, textStatus) => {
                setMessage("warning", `Erro ao buscar setores: ${textStatus}`);
                return [];
            });
    };

    // Busca os setores usando o código do solicitante
    getSetores($(config.codigoSolicitante).val()).then((setores) => {
        if (setores.length > 1) {
            acSetores = FLUIGC.autocomplete(config.setorField, {
                highlight: true,
                minLength: 0,
                hint: true,
                searchTimeout: 100,
                type: "tagAutocomplete",
                name: "setor",
                tagClass: "tag-default",
                maxTags: config.maxTags,
                allowDuplicates: false,
                onTagExists: function () {
                    setMessage("warning", "O setor já está selecionado. Remova-o para adicionar outro.");
                },
                onMaxTags: function () {
                    setMessage("warning", "O setor já está selecionado. Remova-o para adicionar outro.");
                },
                displayKey: "SETOR_PROTHEUS",
                source: substringMatcher(setores),
            })
                .on("fluig.autocomplete.itemAdded", function (event) {
                    config.onItemAdded(event);
                })
                .on("fluig.autocomplete.itemRemoved", function () {
                    config.onItemRemoved();
                });
        } else if (setores.length == 1) {
            $(config.codSetorField).val(setores[0].COD_PROTHEUS);
            $(config.setorField).val(setores[0].SETOR_PROTHEUS);
        }
    });
}

