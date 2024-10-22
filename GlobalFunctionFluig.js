var acEmpresas = null;
var acSetores = null;
var _mobile = false;

const setMobile = (mobile) => {
    _mobile = mobile;
}

const setMessage = (type, message) => {
    FLUIGC.toast({
        type: type,
        message: message,
        timeout: 10000,
    });
}

const autocompleteEmpresas = (settings) => {
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
        fluxoAlcada: null,
        readOnly: false,  // Define se o campo será readonly
        addConfigSelectEmpresa: function () { },  // Callback adicional ao selecionar empresa
        addConfigRemoveEmpresa: function () { },  // Callback adicional ao remover empresa
        selectEmpresa: function (event) {  // Função padrão ao adicionar item
            var filial = event.item.code.split("_")[0];
            $(config.codEmpVariavel).val(filial);
            console.log(config.fluxoAlcada);
            
            if (config.fluxoAlcada == null) {
                autocompleteSetores();
            } else {
                autocompleteSetores({ fluxoAlcada: config.fluxoAlcada });
            }
            config.addConfigSelectEmpresa();
            const setor = $(config.codSetorField).val()
            
            if (config.fluxoAlcada != null && setor != null) {
                consultaAprovadores(filial, setor, config.fluxoAlcada)
            }
        },
        removeEmpresa: function (event) {  // Função padrão ao remover item
            $(config.codEmpVariavel).val("");
            $(config.codSetorField).val("");
            $(config.setorField).val("");
            config.addConfigRemoveEmpresa();
            if (config.fluxoAlcada != null) {
                limpaAlçadas()
            }
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

const autocompleteSetores = (settings) => {


    // Configurações padrão que podem ser sobrescritas
    var config = $.extend({
        codSetorField: "#codSetorSolicitante",    // Campo para armazenar o código do setor
        setorField: "#nomeSetorSolicitante",      // Campo do nome do setor
        codEmpVariavel: "#codEmpresaSolicitante",
        codigoSolicitante: "#codSolicitante",         // ID do campo solicitante
        maxTags: 1,  // Limite de tags
        fluxoAlcada: null,
        onItemAdded: function (event) {
            var setor = event.item.COD_PROTHEUS;
            var filial = $(config.codEmpVariavel).val();
            $(config.codSetorField).val(setor);
            if (config.fluxoAlcada != null) {
                consultaAprovadores(filial, setor, config.fluxoAlcada);
            }
        },
        onItemRemoved: function () {
            $(config.codSetorField).val("");
            if (config.fluxoAlcada != null) {
                limpaAlçadas();
            }
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
    console.log($(config.codigoSolicitante).val());

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

const consultaAprovadores = async (setor, filial, fluxo) => {
    console.log("testando", fluxo);
    
    //Monta as constraints para consulta
    var c1 = DatasetFactory.createConstraint("SETOR", setor, setor, ConstraintType.MUST);
    var c2 = DatasetFactory.createConstraint("FLUXO", fluxo, fluxo, ConstraintType.MUST_NOT);
    var c3 = DatasetFactory.createConstraint("FILIAL", filial, filial, ConstraintType.SHOULD);
    var constraints = new Array(c1, c2, c3);
    var dataset = await DatasetFactory.getDataset("protheus_rest_zcc", null, constraints, null);
    console.log(dataset.values);
    if (dataset.values.length > 0) {
        // console.log(dataset.values[0]);
        setWorkflowValues(dataset.values[0]);
        console.log(dataset.values[0])
        document.getElementById("erroReq").checked = false;
    } else {
        document.getElementById("erroReq").checked = true;
    }
};

const setWorkflowValues = (responseOne) => {
    console.log(responseOne);
    document.getElementById("codUserAlcadaN1").value = responseOne.codUserAlcadaN1;
    document.getElementById("codUserAlcadaN2").value = responseOne.codUserAlcadaN2;
    document.getElementById("codUserAlcadaN3").value = responseOne.codUserAlcadaN3;
    document.getElementById("codUserAlcadaN4").value = responseOne.codUserAlcadaN4;
    document.getElementById("codUserAlcadaN5").value = responseOne.codUserAlcadaN5;
    document.getElementById("codUserAlcadaN6").value = responseOne.codUserAlcadaN6;

    document.getElementById("nameUserAlcadaN1").value = responseOne.nameUserAlcadaN1;
    document.getElementById("nameUserAlcadaN2").value = responseOne.nameUserAlcadaN2;
    document.getElementById("nameUserAlcadaN3").value = responseOne.nameUserAlcadaN3;
    document.getElementById("nameUserAlcadaN4").value = responseOne.nameUserAlcadaN4;
    document.getElementById("nameUserAlcadaN5").value = responseOne.nameUserAlcadaN5;
    document.getElementById("nameUserAlcadaN6").value = responseOne.nameUserAlcadaN6;

    document.getElementById("valorAlcadaN1").value = responseOne.valorAlcadaN1;
    document.getElementById("valorAlcadaN2").value = responseOne.valorAlcadaN2;
    document.getElementById("valorAlcadaN3").value = responseOne.valorAlcadaN3;
    document.getElementById("valorAlcadaN4").value = responseOne.valorAlcadaN4;
    document.getElementById("valorAlcadaN5").value = responseOne.valorAlcadaN5;
    document.getElementById("valorAlcadaN6").value = responseOne.valorAlcadaN6;

    document.getElementById("usaValor").checked = responseOne.usaValor;

    document.getElementById("temN1").checked = responseOne.temN1;
    document.getElementById("temN2").checked = responseOne.temN2;
    document.getElementById("temN3").checked = responseOne.temN3;
    document.getElementById("temN4").checked = responseOne.temN4;
    document.getElementById("temN5").checked = responseOne.temN5;
    document.getElementById("temN6").checked = responseOne.temN6;
};

const limpaAlçadas = () => {
    document.getElementById("codUserAlcadaN1").value = "";
    document.getElementById("codUserAlcadaN2").value = "";
    document.getElementById("codUserAlcadaN3").value = "";
    document.getElementById("codUserAlcadaN4").value = "";
    document.getElementById("codUserAlcadaN5").value = "";
    document.getElementById("codUserAlcadaN6").value = "";

    document.getElementById("temN1").checked = false;
    document.getElementById("temN2").checked = false;
    document.getElementById("temN3").checked = false;
    document.getElementById("temN4").checked = false;
    document.getElementById("temN5").checked = false;
    document.getElementById("temN6").checked = false;

    document.getElementById("nameUserAlcadaN1").value = "";
    document.getElementById("nameUserAlcadaN2").value = "";
    document.getElementById("nameUserAlcadaN3").value = "";
    document.getElementById("nameUserAlcadaN4").value = "";
    document.getElementById("nameUserAlcadaN5").value = "";
    document.getElementById("nameUserAlcadaN6").value = "";

    document.getElementById("valorAlcadaN1").value = "";
    document.getElementById("valorAlcadaN2").value = "";
    document.getElementById("valorAlcadaN3").value = "";
    document.getElementById("valorAlcadaN4").value = "";
    document.getElementById("valorAlcadaN5").value = "";
    document.getElementById("valorAlcadaN6").value = "";

    document.getElementById("usaValor").checked = false;
};