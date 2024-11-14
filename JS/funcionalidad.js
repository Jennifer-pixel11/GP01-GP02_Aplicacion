// Objeto para almacenar los saldos de cada cuenta
const cuentas = {
    "Inventario": { saldo: 0 },
    "Caja": { saldo: 0 },
    "Clientes": { saldo: 0 },
    "Proveedores": { saldo: 0 },
    "Gastos": { saldo: 0 },
    "Ingresos": { saldo: 0 },
    "IvaDebito": { saldo: 0 },  // Cuenta para el IVA generado
    "IvaCredito": { saldo: 0 } // Cuenta para el IVA por Pagar
};

// Función para agregar nuevas cuentas
function addNewAccount() {
    const newAccount = prompt("Ingrese el nombre de la nueva cuenta:");
    if (newAccount && !cuentas[newAccount]) {
        cuentas[newAccount] = { saldo: 0 };
        const cuentaSelect = document.getElementById("cuenta");
        const option = document.createElement("option");
        option.value = newAccount;
        option.text = newAccount;
        cuentaSelect.add(option);
    }
}

////Funciones para subir archivo a Drive
// Reemplaza con el ID de cliente de tu proyecto de Google Cloud
const CLIENT_ID = '754241236882-9qed4rg8vv4qo7riu019bn00qh6d5vu1.apps.googleusercontent.com';
const API_KEY = 'AIzaSyC5Y0fqENyjUg_9aC5CfGMQ40STeB-6uY0';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient;
let gapiInited = false;
let gisInited = false;

// Cargar las bibliotecas de la API de Google
function gapiLoaded() {
  gapi.load('client', initializeGapiClient);
}

// Inicializar el cliente de la API de Google
async function initializeGapiClient() {
  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
  });
  gapiInited = true;
}

// Cargar el script para autenticación
function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: '', // Manejado por handleAuthClick
  });
  gisInited = true;
}

// Autenticar y obtener el token de acceso
function handleAuthClick() {
  tokenClient.callback = async (resp) => {
    if (resp.error) {
      console.error(resp.error);
      return;
    }
    await uploadFile();
  };

  if (gapi.client.getToken() === null) {
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } else {
    tokenClient.requestAccessToken({ prompt: '' });
  }
}

// Función para cargar el archivo a Google Drive
async function uploadFile() {
  const fileInput = document.getElementById('formFile');
  const file = fileInput.files[0];

  if (!file) {
    alert("Selecciona un archivo primero.");
    return;
  }

  const metadata = {
    name: file.name,
    mimeType: file.type
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  try {
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
      method: 'POST',
      headers: new Headers({ 'Authorization': 'Bearer ' + gapi.client.getToken().access_token }),
      body: form
    });
    const result = await response.json();
    alert("Archivo subido con éxito!!");
  } catch (error) {
    console.error('Error al subir el archivo:', error);
    alert('Error al subir el archivo');
  }
}

// Manejar el clic en el botón de subir
document.getElementById('uploadButton').onclick = () => handleAuthClick();

// Cargar los scripts de la API de Google y el cliente de autenticación
const script1 = document.createElement('script');
script1.src = 'https://apis.google.com/js/api.js';
script1.onload = gapiLoaded;
document.body.appendChild(script1);

const script2 = document.createElement('script');
script2.src = 'https://accounts.google.com/gsi/client';
script2.onload = gisLoaded;
document.body.appendChild(script2);

// Función para agregar una entrada en el Libro Diario y actualizar el saldo en el Libro Mayor
function addDiaryEntry(event) {
    event.preventDefault();
    const fecha = document.getElementById("fecha").value;
    const codigoCuenta = document.getElementById("codigoCuenta").value;
    const cuenta = document.getElementById("cuenta").value;
    const debito = parseFloat(document.getElementById("debito").value) || 0;
    const credito = parseFloat(document.getElementById("credito").value) || 0;

    const table = document.getElementById("diaryTable").getElementsByTagName("tbody")[0];
    
    // Formatear la fecha a dd/MM/yyyy
    const ftdFechaDiary = formatDateToDDMMYYYY(fecha);

    // Verificar si ya existe una fila con la misma fecha
    let existingRow = null;
    if (table.rows.length > 0) {
        existingRow = Array.from(table.rows).find(row => row.cells[0].innerText.trim() === fecha);
    }

    // Si no existe una fila con la misma fecha, crear nueva fila
    if (!existingRow) {
        const newRow = table.insertRow();

        // Insertar la fecha en la primera celda
        newRow.insertCell(0).innerText = ftdFechaDiary;
        // Insertar el código de cuenta, cuenta, débito y crédito
        newRow.insertCell(1).innerText = codigoCuenta;
        newRow.insertCell(2).innerText = cuenta;
        newRow.insertCell(3).innerText = debito.toFixed(2);
        newRow.insertCell(4).innerText = credito.toFixed(2);

        // Insertar la celda para el botón de "Eliminar"
        const deleteCell = newRow.insertCell(newRow.cells.length);  // Asegurarse de que se inserta al final
        const deleteButton = document.createElement("button");
        deleteButton.className = "btn btn-danger btn-sm";
        deleteButton.innerText = "Eliminar";
        deleteButton.onclick = function () {
            deleteEntry(newRow, cuenta, debito, credito);
        };
        deleteCell.appendChild(deleteButton);
    } else {
        const newRow = table.insertRow();
        newRow.insertCell(0).innerText = "";
        newRow.insertCell(1).innerText = codigoCuenta;
        newRow.insertCell(2).innerText = cuenta;
        newRow.insertCell(3).innerText = debito.toFixed(2);
        newRow.insertCell(4).innerText = credito.toFixed(2);

        // Insertar la celda para el botón de "Eliminar"
        const deleteCell = newRow.insertCell(newRow.cells.length);  // Asegurarse de que se inserta al final
        const deleteButton = document.createElement("button");
        deleteButton.className = "btn btn-danger btn-sm";
        deleteButton.innerText = "Eliminar";
        deleteButton.onclick = function () {
            deleteEntry(newRow, cuenta, debito, credito);
        };
        deleteCell.appendChild(deleteButton);
    }

    if (cuenta in cuentas) {
        cuentas[cuenta].saldo += debito - credito;
    } else {
        alert("La cuenta especificada no existe.");
    }

    // Guardar automáticamente en el localStorage después de agregar la entrada
    saveDiaryToLocalStorage();
    saveCuentasToLocalStorage();
    updateMayorTable();

    document.getElementById("diaryForm").reset();
}

function deleteEntry(row, cuenta, debito, credito) {
    // Eliminar la fila de la tabla
    row.remove();

    // Actualizar el saldo en el objeto 'cuentas'
    if (cuenta in cuentas) {
        cuentas[cuenta].saldo -= debito - credito;  // Restaurar el saldo eliminado
    }

    // Llamar a la función para actualizar el Libro Mayor
    saveDiaryToLocalStorage();
    saveCuentasToLocalStorage();
    updateMayorTable();
}

// Función para actualizar el Libro Mayor en la tabla HTML
function updateMayorTable() {
    const mayorTableBody = document.querySelector('#mayorTable tbody');
    mayorTableBody.innerHTML = ''; // Limpiar la tabla anterior

    for (const [cuenta, { saldo }] of Object.entries(cuentas)) {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${cuenta}</td><td>${saldo.toFixed(2)}</td>`; // Uso de comillas adecuadas
        mayorTableBody.appendChild(row);
    }
}

function formatDateToDDMMYYYY(dateString) {
    if (!dateString) return ""; // Maneja el caso en que la fecha esté vacía
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
}

// Función para agregar una entrada de venta
function addSalesEntry(event) {
    event.preventDefault();
    const fechaVenta = document.getElementById("fechaVenta").value;
    const clienteVenta = document.getElementById("clienteVenta").value;
    const numeroDocumentoVenta = document.getElementById('numeroDocumentoVenta').value;  // Nuevo campo
    const montoVenta = parseFloat(document.getElementById("montoVenta").value) || 0;
    const formaPagoVenta = document.getElementById('formaPagoVenta').value; 
    const tipoDocumentoVenta = document.getElementById('tipoDocumentoVenta').value;  
    
    // Inicializar variables de IVA y monto total
    let ivaVenta = 0;
    let subtotalVenta = montoVenta;
    let montoTotalVenta = montoVenta;
    let ivaLibro =0;
    // Solo calcular el IVA si el tipo de documento es "CCF" (Comprobante de Crédito Fiscal)
    if (tipoDocumentoVenta === "CCF") {
        subtotalVenta = montoVenta / 1.13;  // Monto sin IVA
        ivaVenta = montoVenta - subtotalVenta;  // Calcular el IVA del 13%
        montoTotalVenta = subtotalVenta + ivaVenta;  // Monto total con IVA
    }
    ivaLibro =  montoVenta - subtotalVenta;
    // Formatear la fecha a dd/MM/yyyy
    const ftdFechaVenta = formatDateToDDMMYYYY(fechaVenta);

    const table = document.getElementById("salesTable").getElementsByTagName("tbody")[0];
    const newRow = table.insertRow();
    newRow.insertCell(0).innerText = ftdFechaVenta;
    newRow.insertCell(1).innerText = clienteVenta;
    newRow.insertCell(2).innerText = numeroDocumentoVenta;
    newRow.insertCell(3).innerText = montoVenta;
    newRow.insertCell(4).innerText = formaPagoVenta;
    newRow.insertCell(5).innerText = tipoDocumentoVenta;
    newRow.insertCell(6).innerText = ivaVenta.toFixed(2);

    // Agrega el botón "Eliminar"
    const deleteCell = newRow.insertCell(7);
    const deleteButton = document.createElement("button");
    deleteButton.innerText = "Eliminar";
    deleteButton.className = "btn btn-danger btn-sm";
    deleteButton.onclick = function () {
        // Llamada a la función de eliminación de ventas, pasando todos los parámetros necasarios
        deleteSalesEntry(newRow, montoVenta, tipoDocumentoVenta, formaPagoVenta, ivaLibro);
    };
    deleteCell.appendChild(deleteButton);

    // Lógica para afectar las cuentas según la forma de pago y el tipo de documento
    if (tipoDocumentoVenta === "Factura") {
        // Si es una Factura (sin IVA)
        if (formaPagoVenta === "Contado") {
            cuentas["Caja"].saldo += montoVenta;  // Incrementar Caja
            cuentas["Inventario"].saldo -= subtotalVenta;  // Decrementar Inventario por la venta
            cuentas["IvaDebito"].saldo += ivaLibro;  // Incrementar IVA por Pagar
        } else if (formaPagoVenta === "Credito") {
            cuentas["Clientes"].saldo += montoVenta;  // Incrementar Clientes
            cuentas["Inventario"].saldo -= subtotalVenta;  // Decrementar Inventario por la venta
            cuentas["IvaDebito"].saldo += ivaLibro;  // Incrementar IVA por Pagar
        }
    } else if (tipoDocumentoVenta === "CCF") {
        // Si es CCF (Con IVA)
        if (formaPagoVenta === "Contado") {
            cuentas["Caja"].saldo += montoTotalVenta;  // Incrementar Caja
            cuentas["Inventario"].saldo -= subtotalVenta;  // Decrementar Inventario por la venta
            cuentas["IvaDebito"].saldo += ivaVenta;  // Incrementar IVA por Pagar
        } else if (formaPagoVenta === "Credito") {
            cuentas["Clientes"].saldo += montoTotalVenta;  // Incrementar Clientes
            cuentas["Inventario"].saldo -= subtotalVenta;  // Decrementar Inventario por la venta
            cuentas["IvaDebito"].saldo += ivaVenta;  // Incrementar IVA por Pagar
        }
    }

    // Actualiza el saldo y almacena en localStorage
    updateMayorTable();
    saveSalesToLocalStorage();
    saveCuentasToLocalStorage();
    document.getElementById("salesForm").reset();
}

// Función para agregar una entrada de compra
function addPurchaseEntry(event) {
    event.preventDefault();
    const fechaCompra = document.getElementById("fechaCompra").value;
    const proveedorCompra = document.getElementById("proveedorCompra").value;
    const numeroDocumentoCompra = document.getElementById('numeroDocumentoCompra').value;  // Nuevo campo
    const montoCompra = parseFloat(document.getElementById("montoCompra").value) || 0;
    const formaPagoCompra = document.getElementById('formaPagoCompra').value;
    const tipoDocumentoCompra = document.getElementById('tipoDocumentoCompra').value;

    // Inicializar variables de IVA y monto total
    let ivaCompra = 0;
    let subtotalCompra = montoCompra;
    let montoTotalCompra = montoCompra;

    // Solo calcular el IVA si el tipo de documento es "CCF" (Comprobante de Crédito Fiscal)
    if (tipoDocumentoCompra === "CCF") {
        subtotalCompra = montoCompra / 1.13;  // Monto sin IVA
        ivaCompra = montoCompra - subtotalCompra;  // Calcular el IVA del 13%
        montoTotalCompra = subtotalCompra + ivaCompra;  // Monto total con IVA
    }

    // Formatear la fecha a dd/MM/yyyy
    const ftdFechaVenta = formatDateToDDMMYYYY(fechaCompra);

    const table = document.getElementById("purchaseTable").getElementsByTagName("tbody")[0];
    const newRow = table.insertRow();
    newRow.insertCell(0).innerText = ftdFechaVenta;
    newRow.insertCell(1).innerText = proveedorCompra;
    newRow.insertCell(2).innerText = numeroDocumentoCompra;
    newRow.insertCell(3).innerText = montoCompra;
    newRow.insertCell(4).innerText = formaPagoCompra;
    newRow.insertCell(5).innerText = tipoDocumentoCompra;
    newRow.insertCell(6).innerText = ivaCompra.toFixed(2);

    // Agrega el botón "Eliminar"
    const deleteCell = newRow.insertCell(7);
    const deleteButton = document.createElement("button");
    deleteButton.innerText = "Eliminar";
    deleteButton.className = "btn btn-danger btn-sm";
    deleteButton.onclick = function () {
        deleteSalesEntry(newRow, montoCompra, tipoDocumentoCompra, formaPagoCompra, ivaCompra); // Llama a la función de eliminación de compras
    };
    deleteCell.appendChild(deleteButton);

    // Actualiza el saldo y almacena en localStorage
    // Lógica para afectar las cuentas según la forma de pago y el tipo de documento
    if (tipoDocumentoCompra === "Factura") {
        // Si es una Factura (sin IVA)
        if (formaPagoCompra === "Contado") {
            cuentas["Caja"].saldo -= montoCompra;  // Decrementar Caja
            cuentas["Inventario"].saldo += subtotalCompra;  // Incrementar Inventario por la compra
        } else if (formaPagoCompra === "Credito") {
            cuentas["Proveedores"].saldo += montoCompra;  // Incrementar Proveedores
            cuentas["Inventario"].saldo += subtotalCompra;  // Incrementar Inventario por la compra
        }
    } else if (tipoDocumentoCompra === "CCF") {
        // Si es CCF (Con IVA)
        if (formaPagoCompra === "Contado") {
            cuentas["Caja"].saldo -= montoTotalCompra;  // Decrementar Caja
            cuentas["Inventario"].saldo += subtotalCompra;  // Incrementar Inventario por la compra
            cuentas["IvaCredito"].saldo += ivaCompra;  // Incrementar IVA por Pagar
        } else if (formaPagoCompra === "Credito") {
            cuentas["Proveedores"].saldo += montoTotalCompra;  // Incrementar Proveedores
            cuentas["Inventario"].saldo += subtotalCompra;  // Incrementar Inventario por la compra
            cuentas["IvaCredito"].saldo += ivaCompra;  // Incrementar IVA por Pagar
        }
    }

    updateMayorTable();
    savePurchaseToLocalStorage();
    saveCuentasToLocalStorage();
    document.getElementById("purchaseForm").reset();
}

// Función para eliminar una entrada de venta
function deleteSalesEntry(row, monto, tipoDocumentoVenta, formaPagoVenta, ivaVenta) {
    const table = document.getElementById("salesTable").getElementsByTagName("tbody")[0];
    table.removeChild(row);

    // Lógica para afectar las cuentas según la forma de pago y el tipo de documento
    if (tipoDocumentoVenta === "Factura") {
        // Si es una Factura (sin IVA)
        if (formaPagoVenta === "Contado") {
            cuentas["Caja"].saldo -= monto;  // Decrementar Caja
            cuentas["Inventario"].saldo += monto;  // Incrementar Inventario por la venta
        } else if (formaPagoVenta === "Credito") {
            cuentas["Clientes"].saldo -= monto;  // Decrementar Clientes
            cuentas["Inventario"].saldo += monto;  // Incrementar Inventario por la venta
        }
    } else if (tipoDocumentoVenta === "CCF") {
        // Si es CCF (Con IVA)
        if (formaPagoVenta === "Contado") {
            cuentas["Caja"].saldo -= monto;  // Decrementar Caja
            cuentas["Inventario"].saldo += monto;  // Incrementar Inventario por la venta
            cuentas["IvaCredito"].saldo -= ivaVenta;  // Decrementar IVA por Pagar
        } else if (formaPagoVenta === "Credito") {
            cuentas["Clientes"].saldo -= monto;  // Decrementar Clientes
            cuentas["Inventario"].saldo += monto;  // Incrementar Inventario por la venta
            cuentas["IvaCredito"].saldo -= ivaVenta;  // Decrementar IVA por Pagar
        }
    }

    // Actualizar el Libro Mayor y el almacenamiento local
    updateMayorTable();
    saveCuentasToLocalStorage();
    saveSalesToLocalStorage();
}

// Función para eliminar una entrada de compra
function deletePurchaseEntry(row, monto, tipoDocumentoCompra, formaPagoCompra, ivaCompra) {
    const table = document.getElementById("purchaseTable").getElementsByTagName("tbody")[0];
    table.removeChild(row);

    // Lógica para afectar las cuentas según la forma de pago y el tipo de documento
    if (tipoDocumentoCompra === "Factura") {
        // Si es una Factura (sin IVA)
        if (formaPagoCompra === "Contado") {
            cuentas["Caja"].saldo += monto;  // Incrementar Caja
            cuentas["Inventario"].saldo -= monto;  // Decrementar Inventario por la compra
        } else if (formaPagoCompra === "Credito") {
            cuentas["Proveedores"].saldo -= monto;  // Decrementar Proveedores
            cuentas["Inventario"].saldo -= monto;  // Decrementar Inventario por la compra
        }
    } else if (tipoDocumentoCompra === "CCF") {
        // Si es CCF (Con IVA)
        if (formaPagoCompra === "Contado") {
            cuentas["Caja"].saldo += monto;  // Incrementar Caja
            cuentas["Inventario"].saldo -= monto;  // Decrementar Inventario por la compra
            cuentas["IvaCredito"].saldo -= ivaCompra;  // Decrementar IVA por Pagar
        } else if (formaPagoCompra === "Credito") {
            cuentas["Proveedores"].saldo -= monto;  // Decrementar Proveedores
            cuentas["Inventario"].saldo -= monto;  // Decrementar Inventario por la compra
            cuentas["IvaCredito"].saldo -= ivaCompra;  // Decrementar IVA por Pagar
        }
    }

    // Actualizar el Libro Mayor y el almacenamiento local
    updateMayorTable();
    saveCuentasToLocalStorage();
    savePurchaseToLocalStorage();
}

///// PERSISTENCIA EN LOCAL STORAGE 
// Función para guardar las entradas del Diario en el localStorage
function saveDiaryToLocalStorage() {
    const diaryData = [];
    document.querySelectorAll('#diaryTable tbody tr').forEach(row => {
        const rowData = {
            fecha: row.cells[0].innerText,
            codigoCuenta: row.cells[1].innerText,
            cuenta: row.cells[2].innerText,
            debe: parseFloat(row.cells[3].innerText) || 0,
            haber: parseFloat(row.cells[4].innerText) || 0
        };
        diaryData.push(rowData);
    });
    localStorage.setItem('diaryData', JSON.stringify(diaryData));
}

// Función para guardar las ventas en el localStorage
function saveSalesToLocalStorage() {
    const salesData = [];
    document.querySelectorAll('#salesTable tbody tr').forEach(row => {
        const rowData = {
            fechaVenta: row.cells[0].innerText,
            clienteVenta: row.cells[1].innerText,
            montoVenta: parseFloat(row.cells[2].innerText) || 0,
            tipoDocumentoVenta: row.cells[3].innerText,  // Añadir tipo de documento
            ivaVenta: parseFloat(row.cells[4].innerText) || 0,  // Añadir IVA de la venta
            formaPagoVenta: row.cells[5].innerText  // Añadir forma de pago
        };
        salesData.push(rowData);
    });
    localStorage.setItem('salesData', JSON.stringify(salesData));
}

// Función para guardar las compras en el localStorage
function savePurchaseToLocalStorage() {
    const purchaseData = [];
    document.querySelectorAll('#purchaseTable tbody tr').forEach(row => {
        const rowData = {
            fechaCompra: row.cells[0].innerText,
            proveedorCompra: row.cells[1].innerText,
            montoCompra: parseFloat(row.cells[2].innerText) || 0,
            tipoDocumentoCompra: row.cells[3].innerText,  // Añadir tipo de documento
            ivaCompra: parseFloat(row.cells[4].innerText) || 0,  // Añadir IVA de la compra
            formaPagoCompra: row.cells[5].innerText  // Añadir forma de pago
        };
        purchaseData.push(rowData);
    });
    localStorage.setItem('purchaseData', JSON.stringify(purchaseData));
}

function saveCuentasToLocalStorage() {
    localStorage.setItem('cuentas', JSON.stringify(cuentas));
}

// Función para cargar las ventas desde el localStorage
function loadSalesFromLocalStorage() {
    const salesData = JSON.parse(localStorage.getItem('salesData'));
    if (salesData && Array.isArray(salesData)) {
        const table = document.getElementById("salesTable").getElementsByTagName("tbody")[0];
        salesData.forEach(({ fechaVenta, clienteVenta, montoVenta, tipoDocumentoVenta, ivaVenta, formaPagoVenta }) => {
            const newRow = table.insertRow();
            newRow.insertCell(0).innerText = fechaVenta;
            newRow.insertCell(1).innerText = clienteVenta;
            newRow.insertCell(2).innerText = montoVenta;
            newRow.insertCell(3).innerText = tipoDocumentoVenta; // Mostrar tipo de documento
            newRow.insertCell(4).innerText = ivaVenta;  // Mostrar IVA
            newRow.insertCell(5).innerText = formaPagoVenta;  // Mostrar forma de pago

            // Agregar botón "Eliminar"
            const deleteCell = newRow.insertCell(6);
            const deleteButton = document.createElement("button");
            deleteButton.innerText = "Eliminar";
            deleteButton.className = "btn btn-danger btn-sm";
            deleteButton.onclick = function () {
                deleteSalesEntry(newRow, parseFloat(montoVenta), tipoDocumentoVenta, formaPagoVenta, ivaVenta); // Llama a la función de eliminación de ventas
            };
            deleteCell.appendChild(deleteButton);
        });
        updateMayorTable(); // Actualiza la tabla del Libro Mayor
    }
}

// Función para cargar las compras desde el localStorage
function loadPurchasesFromLocalStorage() {
    const purchaseData = JSON.parse(localStorage.getItem('purchaseData'));
    if (purchaseData && Array.isArray(purchaseData)) {
        const table = document.getElementById("purchaseTable").getElementsByTagName("tbody")[0];
        purchaseData.forEach(({ fechaCompra, proveedorCompra, montoCompra, tipoDocumentoCompra, ivaCompra, formaPagoCompra }) => {
            const newRow = table.insertRow();
            newRow.insertCell(0).innerText = fechaCompra;
            newRow.insertCell(1).innerText = proveedorCompra;
            newRow.insertCell(2).innerText = montoCompra;
            newRow.insertCell(3).innerText = tipoDocumentoCompra; // Mostrar tipo de documento
            newRow.insertCell(4).innerText = ivaCompra;  // Mostrar IVA
            newRow.insertCell(5).innerText = formaPagoCompra;  // Mostrar forma de pago

            // Agregar botón "Eliminar"
            const deleteCell = newRow.insertCell(6);
            const deleteButton = document.createElement("button");
            deleteButton.innerText = "Eliminar";
            deleteButton.className = "btn btn-danger btn-sm";
            deleteButton.onclick = function () {
                deletePurchaseEntry(newRow, parseFloat(montoCompra), tipoDocumentoCompra, formaPagoCompra, ivaCompra); // Llama a la función de eliminación de compras
            };
            deleteCell.appendChild(deleteButton);
        });
        updateMayorTable(); // Actualiza la tabla del Libro Mayor
    }
}

function exportAllToExcel() {
    const wb = XLSX.utils.book_new();

    // Función para aplicar estilos a las celdas
    const applyCellStyle = (worksheet, cellRef, style) => {
        if (!worksheet[cellRef]) worksheet[cellRef] = {};
        worksheet[cellRef].s = style;
    };

    // Estilo general
    const generalCellStyle = {
        font: {
            color: { rgb: "000000" },
            size: 12,
            bold: false,
            name: 'Arial'
        },
        alignment: {
            horizontal: "center",
            vertical: "center"
        }
    };

    // Libro Diario
    const diaryData = [];
    const diaryHeaders = ["Fecha", "Código Cuenta", "Cuenta", "Débito", "Crédito"];
    diaryData.push(diaryHeaders);
    document.querySelectorAll('#diaryTable tbody tr').forEach(row => {
        const rowData = Array.from(row.children).map(cell => cell.textContent);
        diaryData.push(rowData);
    });
    const diaryWorksheet = XLSX.utils.aoa_to_sheet(diaryData);

    // Estilo para el Libro Diario
    const diaryHeaderStyle = {
        fill: {
            patternType: "solid",
            fgColor: { rgb: "FFDDDD" } // Color de fondo
        },
        font: {
            bold: true,
            color: { rgb: "000000" },
            size: 14
        },
        alignment: {
            horizontal: "center"
        }
    };

    // Aplica el estilo a las celdas del encabezado
    for (let col = 0; col < diaryHeaders.length; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
        applyCellStyle(diaryWorksheet, cellRef, diaryHeaderStyle);
    }

    // Estilo a las filas de datos
    for (let row = 1; row < diaryData.length; row++) {
        for (let col = 0; col < diaryHeaders.length; col++) {
            const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
            applyCellStyle(diaryWorksheet, cellRef, generalCellStyle);
        }
    }

    XLSX.utils.book_append_sheet(wb, diaryWorksheet, "Libro Diario");

    // Libro Mayor
    const mayorData = [];
    const mayorHeaders = ["Cuenta", "Saldo"];
    mayorData.push(mayorHeaders);
    for (const [cuenta, { saldo }] of Object.entries(cuentas)) {
        mayorData.push([cuenta, saldo.toFixed(2)]);
    }
    const mayorWorksheet = XLSX.utils.aoa_to_sheet(mayorData);

    // Aplica estilos similares al Libro Mayor
    const mayorHeaderStyle = {
        fill: {
            patternType: "solid",
            fgColor: { rgb: "DDFFDD" } // Color de fondo
        },
        font: {
            bold: true,
            color: { rgb: "000000" },
            size: 14
        },
        alignment: {
            horizontal: "center"
        }
    };

    for (let col = 0; col < mayorHeaders.length; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
        applyCellStyle(mayorWorksheet, cellRef, mayorHeaderStyle);
    }

    for (let row = 1; row < mayorData.length; row++) {
        for (let col = 0; col < mayorHeaders.length; col++) {
            const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
            applyCellStyle(mayorWorksheet, cellRef, generalCellStyle);
        }
    }

    XLSX.utils.book_append_sheet(wb, mayorWorksheet, "Libro Mayor");

    // Libro de Ventas
    const salesData = [];
    const salesHeaders = ["Fecha", "Cliente", "Monto"];
    salesData.push(salesHeaders);
    document.querySelectorAll('#salesTable tbody tr').forEach(row => {
        const rowData = Array.from(row.children).map(cell => cell.textContent);
        salesData.push(rowData);
    });
    const salesWorksheet = XLSX.utils.aoa_to_sheet(salesData);

    // Aplicar estilos para ventas
    const salesHeaderStyle = {
        fill: {
            patternType: "solid",
            fgColor: { rgb: "DDDDFF" }
        },
        font: {
            bold: true,
            color: { rgb: "000000" },
            size: 14
        },
        alignment: {
            horizontal: "center"
        }
    };

    for (let col = 0; col < salesHeaders.length; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
        applyCellStyle(salesWorksheet, cellRef, salesHeaderStyle);
    }

    for (let row = 1; row < salesData.length; row++) {
        for (let col = 0; col < salesHeaders.length; col++) {
            const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
            applyCellStyle(salesWorksheet, cellRef, generalCellStyle);
        }
    }

    XLSX.utils.book_append_sheet(wb, salesWorksheet, "Libro de Ventas");

    // Libro de Compras
    const purchaseData = [];
    const purchaseHeaders = ["Fecha", "Proveedor", "Monto"];
    purchaseData.push(purchaseHeaders);
    document.querySelectorAll('#purchaseTable tbody tr').forEach(row => {
        const rowData = Array.from(row.children).map(cell => cell.textContent);
        purchaseData.push(rowData);
    });
    const purchaseWorksheet = XLSX.utils.aoa_to_sheet(purchaseData);

    // Aplicar estilos para compras
    const purchaseHeaderStyle = {
        fill: {
            patternType: "solid",
            fgColor: { rgb: "FFFFDD" }
        },
        font: {
            bold: true,
            color: { rgb: "000000" },
            size: 14
        },
        alignment: {
            horizontal: "center"
        }
    };

    for (let col = 0; col < purchaseHeaders.length; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
        applyCellStyle(purchaseWorksheet, cellRef, purchaseHeaderStyle);
    }

    for (let row = 1; row < purchaseData.length; row++) {
        for (let col = 0; col < purchaseHeaders.length; col++) {
            const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
            applyCellStyle(purchaseWorksheet, cellRef, generalCellStyle);
        }
    }

    XLSX.utils.book_append_sheet(wb, purchaseWorksheet, "Libro de Compras");

    // Descargar el archivo
    XLSX.writeFile(wb, 'Catálogo_de_Cuentas_Gimnasio.xlsx');
}


// Función para mostrar el contenido y ocultar la bienvenida
function showContent(id) {
    // Oculta la bienvenida
    document.getElementById("bienvenida").style.display = "none";


    // Oculta todos los contenidos
    const contents = document.querySelectorAll('.content');
    contents.forEach(content => content.classList.remove('active'));

    // Muestra el contenido seleccionado
    const selectedContent = document.getElementById(id);
    selectedContent.classList.add('active');
    const box = document.getElementById("upload")
    const exp = document.getElementById("exportButtons")
    exp.style.display = "block"
    box.style.display = "block"
}

async function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let addedPages = false; // Para controlar si se añade alguna página

    // Función para verificar si un canvas es "blanco"
    const isCanvasBlank = (canvas) => {
        if (canvas.width === 0 || canvas.height === 0) {
            return true; // Si el canvas no tiene dimensiones válidas, consideramos que está vacío
        }
        
        const context = canvas.getContext('2d');
        const pixelData = context.getImageData(0, 0, canvas.width, canvas.height).data;

        // Recorre los píxeles en saltos y verifica si todos son blancos
        for (let i = 0; i < pixelData.length; i += 4) {
            if (!(pixelData[i] === 255 && pixelData[i + 1] === 255 && pixelData[i + 2] === 255 && pixelData[i + 3] === 255)) {
                return false; // Tiene contenido
            }
        }
        return true; // Es blanco
    };

    // Función para añadir tablas al PDF solo si no están vacías
    const addTableToPDF = async (tableId, title, x, y) => {
        const table = document.getElementById(tableId);
        const canvas = await html2canvas(table);
        
        // Verifica si la tabla tiene contenido
        if (!isCanvasBlank(canvas)) {
            // Si tiene contenido, añade el título y la tabla
            doc.setFontSize(16);
            doc.text(title, x, y);  // Coloca el título en la posición (x, y)
            const imgData = canvas.toDataURL("image/png");
            doc.addImage(imgData, "PNG", x, y + 10, 190, 0); // Ajusta la posición vertical si es necesario
            addedPages = true; // Marca que se ha añadido una página
            doc.addPage(); // Añade una nueva página después de cada tabla
        }
    };

    // Añadir cada tabla al PDF con un título solo si tiene datos
    await addTableToPDF("diaryTable", "Libro Diario", 10, 20);  // Título: "Libro Diario"
    await addTableToPDF("mayorTable", "Libro Mayor", 10, 20);    // Título: "Libro Mayor"
    await addTableToPDF("salesTable", "Libro de Ventas", 10, 20);  // Título: "Libro de Ventas"
    await addTableToPDF("purchaseTable", "Libro de Compras", 10, 20);  // Título: "Libro de Compras"

    // Guarda el PDF solo si tiene contenido
    if (addedPages) {
        doc.save("Catalogo_de_Cuentas_Gimnasio.pdf");
    } else {
        alert("No hay datos para exportar al PDF.");
    }
}

