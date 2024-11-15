// Objeto para almacenar los saldos y movimientos de cada cuenta
let cuentas = {
    "Inventario": {
        codigoCuenta: "1109",
        saldo: 0,
        movimientos: []  // Arreglo para almacenar los movimientos de la cuenta
    },
    "Caja": {
        codigoCuenta: "1101",
        saldo: 0,
        movimientos: []
    },
    "Clientes": {
        codigoCuenta: "1103",
        saldo: 0,
        movimientos: []
    },
    "Proveedores": {
        codigoCuenta: "2101",
        saldo: 0,
        movimientos: []
    },
    "Gastos": {
        codigoCuenta: "4101",
        saldo: 0,
        movimientos: []
    },
    "Ingresos": {
        codigoCuenta: "5101",
        saldo: 0,
        movimientos: []
    },
    "IvaDebito": {
        codigoCuenta: "2106",
        saldo: 0,
        movimientos: []
    },  // Cuenta para el IVA generado
    "IvaCredito": {
        codigoCuenta: "1106",
        saldo: 0,
        movimientos: []
    } // Cuenta para el IVA por Pagar
};

// Usar window.onload para llamar a loadData cuando la página se cargue
window.onload = function() {
    loadData();  // Llamar a la función loadData para cargar los datos de localStorage
};

// Función para cargar todas las estructuras desde el localStorage al recargar la página
function loadData() {
    // Cargar las cuentas desde el localStorage
    loadCuentasFromLocalStorage();
    
    // Cargar las ventas desde el localStorage
    loadSalesFromLocalStorage();
    
    // Cargar las compras desde el localStorage
    loadPurchasesFromLocalStorage();
    
    // Cargar las entradas del diario desde el localStorage (si tienes esta funcionalidad)
    loadDiaryFromLocalStorage();
    
    // Actualizar la tabla del Libro Mayor
    updateMayorTable();
}

const movimientos = [];

// Función para agregar nuevas cuentas
function addNewAccount() {
    const newAccount = prompt("Ingrese el nombre de la nueva cuenta:");
    if (newAccount && !cuentas[newAccount]) {
        cuentas[newAccount] = {
            saldo: 0,
            movimientos: []
        };
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

    // Actualizar el saldo de la cuenta en el objeto de cuentas
    if (cuenta in cuentas) {
        cuentas[cuenta].saldo += debito - credito;
        cuentas[cuenta].codigoCuenta = codigoCuenta;
        // Agregar el movimiento al array de movimientos de la cuenta
        cuentas[cuenta].movimientos.push({
            fecha: ftdFechaDiary,
            debe: debito,
            haber: credito
        });
    } else {
        alert("La cuenta especificada no existe.");
    }
    // Guardar automáticamente en el localStorage después de agregar la entrada
    saveDiaryToLocalStorage();
    saveCuentasToLocalStorage();
    updateMayorTable();

    document.getElementById("diaryForm").reset();
}

// Cargar cuentas desde el localStorage y actualizar el menú desplegable
function loadAccountsFromLocalStorage() {
    const storedCuentas = JSON.parse(localStorage.getItem("cuentas")) || {};
    cuentas = storedCuentas; // Actualiza el objeto de cuentas con las guardadas en localStorage

    const cuentaSelect = document.getElementById("cuenta");
    cuentaSelect.innerHTML = '<option value="" disabled selected>Seleccionar cuenta</option>'; // Reinicia el contenido del menú

    for (const cuenta in cuentas) {
        const option = document.createElement("option");
        option.value = cuenta;
        option.text = cuenta;
        cuentaSelect.add(option);
    }
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
    for (const [cuenta, { codigoCuenta, saldo, movimientos }] of Object.entries(cuentas)) {
        // Primero agregamos una fila con el saldo final de la cuenta
        const row = document.createElement('tr');
        row.innerHTML = `<td></td><td>${codigoCuenta}</td><td>${cuenta}</td><td></td><td></td><td>${saldo.toFixed(2)}</td>`;
        mayorTableBody.appendChild(row);

        // Ahora agregamos cada movimiento
        movimientos.forEach(({ fecha, debe, haber }) => {
            const movimientoRow = document.createElement('tr');
            movimientoRow.innerHTML = `
                <td>${fecha}</td>
                <td></td><td></td>   <!-- Columna vacía para la cuenta -->
                <td>${debe.toFixed(2)}</td>
                <td>${haber.toFixed(2)}</td>
                <td></td>  <!-- Columna vacía para saldo -->
            `;
            mayorTableBody.appendChild(movimientoRow);
        });
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
    let montoVenta = parseFloat(document.getElementById("montoVenta").value) || 0;
    const formaPagoVenta = document.getElementById('formaPagoVenta').value;
    const tipoDocumentoVenta = document.getElementById('tipoDocumentoVenta').value;


    // Inicializar variables de IVA y monto total
    let subtotalVenta = montoVenta / 1.13;
    let ivaLibro = 0;
    ivaLibro *= subtotalVenta;
    let ivaVenta = 0;
    if (tipoDocumentoVenta === "CCF") {
        ivaVenta = subtotalVenta * 0.13;
    }
    let montoTotalVenta = montoVenta;


    ivaLibro = montoVenta - subtotalVenta;
    // Formatear la fecha a dd/MM/yyyy
    const ftdFechaVenta = formatDateToDDMMYYYY(fechaVenta);

    const table = document.getElementById("salesTable").getElementsByTagName("tbody")[0];
    const newRow = table.insertRow();
    newRow.insertCell(0).innerText = ftdFechaVenta;
    newRow.insertCell(1).innerText = clienteVenta;
    newRow.insertCell(2).innerText = numeroDocumentoVenta;
    newRow.insertCell(3).innerText = montoVenta.toFixed(2);
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
            // Incrementar Caja
            cuentas["Caja"].saldo += montoVenta;
            cuentas["Caja"].movimientos.push({
                fecha: ftdFechaVenta,
                debe: montoVenta,
                haber: 0
            });

            // Decrementar Inventario por la venta
            cuentas["Inventario"].saldo -= subtotalVenta;
            cuentas["Inventario"].movimientos.push({
                fecha: ftdFechaVenta,
                debe: 0,
                haber: subtotalVenta
            });

            // Incrementar IVA por Pagar
            cuentas["IvaDebito"].saldo += ivaLibro;
            cuentas["IvaDebito"].movimientos.push({
                fecha: ftdFechaVenta,
                debe: ivaLibro,
                haber: 0
            });
        } else if (formaPagoVenta === "Credito") {
            // Incrementar Clientes
            cuentas["Clientes"].saldo += montoVenta;
            cuentas["Clientes"].movimientos.push({
                fecha: ftdFechaVenta,
                debe: montoVenta,
                haber: 0
            });

            // Decrementar Inventario por la venta
            cuentas["Inventario"].saldo -= subtotalVenta;
            cuentas["Inventario"].movimientos.push({
                fecha: ftdFechaVenta,
                debe: 0,
                haber: subtotalVenta
            });

            // Incrementar IVA por Pagar
            cuentas["IvaDebito"].saldo += ivaLibro;
            cuentas["IvaDebito"].movimientos.push({
                fecha: ftdFechaVenta,
                debe: ivaLibro,
                haber: 0
            });
        }
    } else if (tipoDocumentoVenta === "CCF") {
        // Si es CCF (Con IVA)
        if (formaPagoVenta === "Contado") {
            // Incrementar Caja
            cuentas["Caja"].saldo += montoTotalVenta;
            cuentas["Caja"].movimientos.push({
                fecha: ftdFechaVenta,
                debe: montoTotalVenta,
                haber: 0
            });

            // Decrementar Inventario por la venta
            cuentas["Inventario"].saldo -= subtotalVenta;
            cuentas["Inventario"].movimientos.push({
                fecha: ftdFechaVenta,
                debe: 0,
                haber: subtotalVenta
            });

            // Incrementar IVA por Pagar
            cuentas["IvaDebito"].saldo += ivaVenta;
            cuentas["IvaDebito"].movimientos.push({
                fecha: ftdFechaVenta,
                debe: ivaVenta,
                haber: 0
            });
        } else if (formaPagoVenta === "Credito") {
            // Incrementar Clientes
            cuentas["Clientes"].saldo += montoTotalVenta;
            cuentas["Clientes"].movimientos.push({
                fecha: ftdFechaVenta,
                debe: montoTotalVenta,
                haber: 0
            });

            // Decrementar Inventario por la venta
            cuentas["Inventario"].saldo -= subtotalVenta;
            cuentas["Inventario"].movimientos.push({
                fecha: ftdFechaVenta,
                debe: 0,
                haber: subtotalVenta
            });

            // Incrementar IVA por Pagar
            cuentas["IvaDebito"].saldo += ivaVenta;
            cuentas["IvaDebito"].movimientos.push({
                fecha: ftdFechaVenta,
                debe: ivaVenta,
                haber: 0
            });
        }
    }

    // Actualiza la tabla mayor
    updateMayorTable();
    saveSalesToLocalStorage();
    saveCuentasToLocalStorage();
    updateDiaryTable(); // Actualizar libro diario después de agregar una compra
    document.getElementById("salesForm").reset();
}

// Función para actualizar el libro diario con las entradas de ventas y compras, ordenadas por fecha
function updateDiaryTable() {
    // Obtener el cuerpo de la tabla del libro diario
    const diaryTableBody = document.getElementById("diaryTable").getElementsByTagName("tbody")[0];
    
    // Limpiar el contenido actual de la tabla
    diaryTableBody.innerHTML = "";

    // Recopilar todos los movimientos en un array
    let allMovements = [];

    // Recorrer cada cuenta y extraer sus movimientos
    Object.keys(cuentas).forEach(cuentaNombre => {
        const cuenta = cuentas[cuentaNombre];
        
        cuenta.movimientos.forEach(movimiento => {
            // Añadir el nombre y código de la cuenta a cada movimiento para luego mostrarlo en la tabla
            allMovements.push({
                fecha: movimiento.fecha,
                codigoCuenta: cuenta.codigoCuenta,
                cuentaNombre: cuentaNombre,
                debe: movimiento.debe,
                haber: movimiento.haber
            });
        });
    });

    // Ordenar los movimientos por fecha en formato "DD/MM/YYYY"
    allMovements.sort((a, b) => {
        const [dayA, monthA, yearA] = a.fecha.split("/").map(Number);
        const [dayB, monthB, yearB] = b.fecha.split("/").map(Number);
        const dateA = new Date(yearA, monthA - 1, dayA); // Crear objeto Date para la fecha A
        const dateB = new Date(yearB, monthB - 1, dayB); // Crear objeto Date para la fecha B
        return dateA - dateB; // Orden ascendente
    });

    // Insertar los movimientos ordenados en la tabla del libro diario
    allMovements.forEach(movimiento => {
        const newRow = diaryTableBody.insertRow();

        // Añadir columnas a la fila
        newRow.insertCell(0).innerText = movimiento.fecha;
        newRow.insertCell(1).innerText = movimiento.codigoCuenta;
        newRow.insertCell(2).innerText = movimiento.cuentaNombre;
        newRow.insertCell(3).innerText = movimiento.debe.toFixed(2);
        newRow.insertCell(4).innerText = movimiento.haber.toFixed(2);
    });

    // Guardar el contenido actualizado del libro diario en localStorage
    saveDiaryToLocalStorage();
}


// Función para agregar una entrada de compra
function addPurchaseEntry(event) {
    event.preventDefault();
    const fechaCompra = document.getElementById("fechaCompra").value;
    const proveedorCompra = document.getElementById("proveedorCompra").value;
    const numeroDocumentoCompra = document.getElementById('numeroDocumentoCompra').value;  // Nuevo campo
    let montoCompra = parseFloat(document.getElementById("montoCompra").value) || 0;
    const formaPagoCompra = document.getElementById('formaPagoCompra').value;
    const tipoDocumentoCompra = document.getElementById('tipoDocumentoCompra').value;

    // Inicializar variables de IVA y monto total
    let subtotalCompra = montoCompra / 1.13;
    let ivaCompra = 0;
    if (tipoDocumentoCompra === "CCF") {
        ivaCompra = subtotalCompra * 0.13;
    }
    let montoTotalCompra = montoCompra;

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
        deletePurchaseEntry(newRow, montoCompra, tipoDocumentoCompra, formaPagoCompra, ivaCompra); // Llama a la función de eliminación de compras
    };
    deleteCell.appendChild(deleteButton);

    // Actualiza el saldo y almacena en localStorage
    // Lógica para afectar las cuentas según la forma de pago y el tipo de documento
    if (tipoDocumentoCompra === "Factura") {
        if (formaPagoCompra === "Contado") {
            // Decrementar Caja
            cuentas["Caja"].saldo -= montoCompra;
            cuentas["Caja"].movimientos.push({
                fecha: ftdFechaVenta,
                debe: 0,
                haber: montoCompra
            });

            // Incrementar Inventario
            cuentas["Inventario"].saldo += subtotalCompra;
            cuentas["Inventario"].movimientos.push({
                fecha: ftdFechaVenta,
                debe: subtotalCompra,
                haber: 0
            });
        } else if (formaPagoCompra === "Credito") {
            // Incrementar Proveedores
            cuentas["Proveedores"].saldo += montoCompra;
            cuentas["Proveedores"].movimientos.push({
                fecha: ftdFechaVenta,
                debe: 0,
                haber: montoTotalCompra
            });

            // Incrementar Inventario
            cuentas["Inventario"].saldo += subtotalCompra;
            cuentas["Inventario"].movimientos.push({
                fecha: ftdFechaVenta,
                debe: subtotalCompra,
                haber: 0
            });
        }
    } else if (tipoDocumentoCompra === "CCF") {
        if (formaPagoCompra === "Contado") {
            // Decrementar Caja
            cuentas["Caja"].saldo -= montoTotalCompra;
            cuentas["Caja"].movimientos.push({
                fecha: ftdFechaVenta,
                debe: 0,
                haber: montoTotalCompra
            });

            // Incrementar Inventario
            cuentas["Inventario"].saldo += subtotalCompra;
            cuentas["Inventario"].movimientos.push({
                fecha: ftdFechaVenta,
                debe: subtotalCompra,
                haber: 0
            });

            // Incrementar IVA
            cuentas["IvaCredito"].saldo += ivaCompra;
            cuentas["IvaCredito"].movimientos.push({
                fecha: ftdFechaVenta,
                debe: ivaCompra,
                haber: 0
            });
        } else if (formaPagoCompra === "Credito") {
            // Incrementar Proveedores
            cuentas["Proveedores"].saldo += montoTotalCompra;
            cuentas["Proveedores"].movimientos.push({
                fecha: ftdFechaVenta,
                debe: 0,
                haber: montoTotalCompra
            });

            // Incrementar Inventario
            cuentas["Inventario"].saldo += subtotalCompra;
            cuentas["Inventario"].movimientos.push({
                fecha: ftdFechaVenta,
                debe: subtotalCompra,
                haber: 0
            });

            // Incrementar IVA
            cuentas["IvaCredito"].saldo += ivaCompra;
            cuentas["IvaCredito"].movimientos.push({
                fecha: ftdFechaVenta,
                debe: ivaCompra,
                haber: 0
            });
        }
    }

    updateMayorTable();
    savePurchaseToLocalStorage();
    saveCuentasToLocalStorage();
    updateDiaryTable(); // Actualizar libro diario después de agregar una compra
    document.getElementById("purchaseForm").reset();
}

// Función para eliminar una entrada de venta
function deleteSalesEntry(row, monto, tipoDocumentoVenta, formaPagoVenta, ivaVenta) {
    const table = document.getElementById("salesTable").getElementsByTagName("tbody")[0];
    table.removeChild(row);  // Eliminar la fila de la tabla de ventas

    // Lógica para revertir las cuentas según la forma de pago y el tipo de documento
    if (tipoDocumentoVenta === "Factura") {
        // Si es una Factura (sin IVA)
        if (formaPagoVenta === "Contado") {
            // Revertir el incremento en Caja
            cuentas["Caja"].saldo -= monto;
            // Revertir la disminución en Inventario
            cuentas["Inventario"].saldo += monto / 1.13;  // Subir el monto original, sin IVA
            // Revertir el incremento en IVA por Pagar
            cuentas["IvaDebito"].saldo -= ivaVenta;
            cuentas["Caja"].movimientos.pop();  // Eliminar el último movimiento en Caja
            cuentas["Inventario"].movimientos.pop();  // Eliminar el último movimiento en Inventario
            cuentas["IvaDebito"].movimientos.pop();  // Eliminar el último movimiento en IVA
        } else if (formaPagoVenta === "Credito") {
            // Revertir el incremento en Clientes
            cuentas["Clientes"].saldo -= monto;
            // Revertir la disminución en Inventario
            cuentas["Inventario"].saldo += monto / 1.13;
            cuentas["Clientes"].movimientos.pop();  // Eliminar el último movimiento en Clientes
            cuentas["Inventario"].movimientos.pop();  // Eliminar el último movimiento en Inventario
        }
    } else if (tipoDocumentoVenta === "CCF") {
        // Si es CCF (Con IVA)
        if (formaPagoVenta === "Contado") {
            // Revertir el incremento en Caja
            cuentas["Caja"].saldo -= monto;
            // Revertir la disminución en Inventario
            cuentas["Inventario"].saldo += monto / 1.13;
            // Revertir el incremento en IVA por Pagar
            cuentas["IvaDebito"].saldo -= ivaVenta;
            cuentas["Caja"].movimientos.pop();  // Eliminar el último movimiento en Caja
            cuentas["Inventario"].movimientos.pop();  // Eliminar el último movimiento en Inventario
            cuentas["IvaDebito"].movimientos.pop();  // Eliminar el último movimiento en IVA
        } else if (formaPagoVenta === "Credito") {
            // Revertir el incremento en Clientes
            cuentas["Clientes"].saldo -= monto;
            // Revertir la disminución en Inventario
            cuentas["Inventario"].saldo += monto / 1.13;
            // Revertir el incremento en IVA por Pagar
            cuentas["IvaDebito"].saldo -= ivaVenta;
            cuentas["Clientes"].movimientos.pop();  // Eliminar el último movimiento en Clientes
            cuentas["Inventario"].movimientos.pop();  // Eliminar el último movimiento en Inventario
            cuentas["IvaDebito"].movimientos.pop();  // Eliminar el último movimiento en IVA
        }
    }

    // Eliminar los movimientos en el libro diario relacionados con esta compra
    const diaryTableBody = document.getElementById("diaryTable").getElementsByTagName("tbody")[0];

    // Recorrer los movimientos de las cuentas y eliminar los correspondientes al mismo día y a la misma cuenta
    Object.keys(cuentas).forEach(cuentaNombre => {
        const cuenta = cuentas[cuentaNombre];

        // Filtramos solo los movimientos que coinciden con la fecha de compra
        cuenta.movimientos = cuenta.movimientos.filter((movimiento) => {
            if (movimiento.fecha === fechaCompra) {
                // Buscar y eliminar la fila correspondiente en el libro diario
                let rowToRemove = Array.from(diaryTableBody.rows).find(diaryRow => {
                    const cells = diaryRow.getElementsByTagName("td");
                    return cells[0].innerText === movimiento.fecha && cells[1].innerText === cuentaNombre;
                });

                if (rowToRemove) {
                    diaryTableBody.deleteRow(rowToRemove.rowIndex); // Eliminar la fila en el libro diario
                }
                return false;  // Filtrar (eliminar) este movimiento de la cuenta
            }
            return true;  // Mantener este movimiento en la cuenta
        });
    });

    // Actualizar el Libro Mayor y el almacenamiento local
    updateMayorTable();  // Actualiza la tabla del Libro Mayor
    saveCuentasToLocalStorage();  // Guarda los cambios de cuentas en el almacenamiento local
    saveSalesToLocalStorage();  // Guarda las ventas restantes en el almacenamiento local
}

// Función para eliminar una entrada de compra
/*function deletePurchaseEntry(row, monto, tipoDocumentoCompra, formaPagoCompra, ivaCompra) {
    const table = document.getElementById("purchaseTable").getElementsByTagName("tbody")[0];
    table.removeChild(row);  // Eliminar la fila de la tabla de compras

    // Lógica para revertir las cuentas según la forma de pago y el tipo de documento
    if (tipoDocumentoCompra === "Factura") {
        // Si es una Factura (sin IVA)
        if (formaPagoCompra === "Contado") {
            // Revertir el decremento en Caja
            cuentas["Caja"].saldo += monto;
            // Revertir la incremento en Inventario
            cuentas["Inventario"].saldo -= monto / 1.13;  // Subir el monto original sin IVA
            cuentas["Caja"].movimientos.pop();  // Eliminar el último movimiento en Caja
            cuentas["Inventario"].movimientos.pop();  // Eliminar el último movimiento en Inventario
        } else if (formaPagoCompra === "Credito") {
            // Revertir el incremento en Proveedores
            cuentas["Proveedores"].saldo -= monto;
            // Revertir la incremento en Inventario
            cuentas["Inventario"].saldo -= monto / 1.13;  // Subir el monto original sin IVA
            cuentas["Proveedores"].movimientos.pop();  // Eliminar el último movimiento en Proveedores
            cuentas["Inventario"].movimientos.pop();  // Eliminar el último movimiento en Inventario
        }
    } else if (tipoDocumentoCompra === "CCF") {
        // Si es CCF (Con IVA)
        if (formaPagoCompra === "Contado") {
            // Revertir el decremento en Caja
            cuentas["Caja"].saldo += monto;
            // Revertir la incremento en Inventario
            cuentas["Inventario"].saldo -= monto / 1.13;  // Subir el monto original sin IVA
            // Revertir el decremento en IVA por Pagar
            cuentas["IvaCredito"].saldo -= ivaCompra;
            cuentas["Caja"].movimientos.pop();  // Eliminar el último movimiento en Caja
            cuentas["Inventario"].movimientos.pop();  // Eliminar el último movimiento en Inventario
            cuentas["IvaCredito"].movimientos.pop();  // Eliminar el último movimiento en IVA
        } else if (formaPagoCompra === "Credito") {
            // Revertir el incremento en Proveedores
            cuentas["Proveedores"].saldo -= monto;
            // Revertir la incremento en Inventario
            cuentas["Inventario"].saldo -= monto / 1.13;  // Subir el monto original sin IVA
            // Revertir el decremento en IVA por Pagar
            cuentas["IvaCredito"].saldo -= ivaCompra;
            cuentas["Proveedores"].movimientos.pop();  // Eliminar el último movimiento en Proveedores
            cuentas["Inventario"].movimientos.pop();  // Eliminar el último movimiento en Inventario
            cuentas["IvaCredito"].movimientos.pop();  // Eliminar el último movimiento en IVA
        }
    }

    // Actualizar el Libro Mayor y el almacenamiento local
    updateMayorTable();  // Actualiza la tabla del Libro Mayor
    saveCuentasToLocalStorage();  // Guarda los cambios de cuentas en el almacenamiento local
    savePurchaseToLocalStorage();  // Guarda las compras restantes en el almacenamiento local
}*/
// Función para eliminar una entrada de compra
// Función para eliminar una entrada de compra
function deletePurchaseEntry(row, monto, tipoDocumentoCompra, formaPagoCompra, ivaCompra) {
    const table = document.getElementById("purchaseTable").getElementsByTagName("tbody")[0];
    table.removeChild(row);  // Eliminar la fila de la tabla de compras

    // Lógica para revertir las cuentas según la forma de pago y el tipo de documento
    let fechaCompra = row.cells[0].innerText;  // Obtener la fecha desde la fila de la tabla de compras

    if (tipoDocumentoCompra === "Factura") {
        // Si es una Factura (sin IVA)
        if (formaPagoCompra === "Contado") {
            // Revertir el decremento en Caja
            cuentas["Caja"].saldo += monto;
            // Revertir la incremento en Inventario
            cuentas["Inventario"].saldo -= monto / 1.13;  // Subir el monto original sin IVA
            cuentas["Caja"].movimientos.pop();  // Eliminar el último movimiento en Caja
            cuentas["Inventario"].movimientos.pop();  // Eliminar el último movimiento en Inventario
        } else if (formaPagoCompra === "Credito") {
            // Revertir el incremento en Proveedores
            cuentas["Proveedores"].saldo -= monto;
            // Revertir la incremento en Inventario
            cuentas["Inventario"].saldo -= monto / 1.13;  // Subir el monto original sin IVA
            cuentas["Proveedores"].movimientos.pop();  // Eliminar el último movimiento en Proveedores
            cuentas["Inventario"].movimientos.pop();  // Eliminar el último movimiento en Inventario
        }
    } else if (tipoDocumentoCompra === "CCF") {
        // Si es CCF (Con IVA)
        if (formaPagoCompra === "Contado") {
            // Revertir el decremento en Caja
            cuentas["Caja"].saldo += monto;
            // Revertir la incremento en Inventario
            cuentas["Inventario"].saldo -= monto / 1.13;  // Subir el monto original sin IVA
            // Revertir el decremento en IVA por Pagar
            cuentas["IvaCredito"].saldo -= ivaCompra;
            cuentas["Caja"].movimientos.pop();  // Eliminar el último movimiento en Caja
            cuentas["Inventario"].movimientos.pop();  // Eliminar el último movimiento en Inventario
            cuentas["IvaCredito"].movimientos.pop();  // Eliminar el último movimiento en IVA
        } else if (formaPagoCompra === "Credito") {
            // Revertir el incremento en Proveedores
            cuentas["Proveedores"].saldo -= monto;
            // Revertir la incremento en Inventario
            cuentas["Inventario"].saldo -= monto / 1.13;  // Subir el monto original sin IVA
            // Revertir el decremento en IVA por Pagar
            cuentas["IvaCredito"].saldo -= ivaCompra;
            cuentas["Proveedores"].movimientos.pop();  // Eliminar el último movimiento en Proveedores
            cuentas["Inventario"].movimientos.pop();  // Eliminar el último movimiento en Inventario
            cuentas["IvaCredito"].movimientos.pop();  // Eliminar el último movimiento en IVA
        }
    }

    // Eliminar los movimientos en el libro diario relacionados con esta compra
    const diaryTableBody = document.getElementById("diaryTable").getElementsByTagName("tbody")[0];

    // Recorrer los movimientos de las cuentas y eliminar los correspondientes al mismo día y a la misma cuenta
    Object.keys(cuentas).forEach(cuentaNombre => {
        const cuenta = cuentas[cuentaNombre];

        // Filtramos solo los movimientos que coinciden con la fecha de compra
        cuenta.movimientos = cuenta.movimientos.filter((movimiento) => {
            if (movimiento.fecha === fechaCompra) {
                // Buscar y eliminar la fila correspondiente en el libro diario
                let rowToRemove = Array.from(diaryTableBody.rows).find(diaryRow => {
                    const cells = diaryRow.getElementsByTagName("td");
                    return cells[0].innerText === movimiento.fecha && cells[1].innerText === cuentaNombre;
                });

                if (rowToRemove) {
                    diaryTableBody.deleteRow(rowToRemove.rowIndex); // Eliminar la fila en el libro diario
                }
                return false;  // Filtrar (eliminar) este movimiento de la cuenta
            }
            return true;  // Mantener este movimiento en la cuenta
        });
    });

    // Actualizar el Libro Mayor y el almacenamiento local
    updateMayorTable();  // Actualiza la tabla del Libro Mayor
    saveCuentasToLocalStorage();  // Guarda los cambios de cuentas en el almacenamiento local
    savePurchaseToLocalStorage();  // Guarda las compras restantes en el almacenamiento local
}


// Función para cargar las ventas desde el localStorage y ordenarlas por fecha
function loadSalesFromLocalStorage() {
    const salesData = JSON.parse(localStorage.getItem('salesData'));
    if (salesData && Array.isArray(salesData)) {
        // Ordenar las ventas por fecha en formato DD/MM/YYYY
        salesData.sort((a, b) => {
            const [dayA, monthA, yearA] = a.fechaVenta.split("/").map(Number);
            const [dayB, monthB, yearB] = b.fechaVenta.split("/").map(Number);
            const dateA = new Date(yearA, monthA - 1, dayA);
            const dateB = new Date(yearB, monthB - 1, dayB);
            return dateA - dateB; // Orden ascendente por fecha
        });

        // Obtener el cuerpo de la tabla
        const table = document.getElementById("salesTable").getElementsByTagName("tbody")[0];
        
        // Insertar las ventas ordenadas en la tabla
        salesData.forEach(({ fechaVenta, clienteVenta, numeroDocumentoVenta, montoVenta, tipoDocumentoVenta, formaPagoVenta, ivaVenta }) => {
            // Crear una nueva fila
            const newRow = table.insertRow();
            newRow.insertCell(0).innerText = fechaVenta;
            newRow.insertCell(1).innerText = clienteVenta;
            newRow.insertCell(2).innerText = numeroDocumentoVenta;
            newRow.insertCell(3).innerText = montoVenta;
            newRow.insertCell(4).innerText = formaPagoVenta;
            newRow.insertCell(5).innerText = tipoDocumentoVenta;
            newRow.insertCell(6).innerText = ivaVenta;

            // Crear la celda para el botón de eliminar
            const deleteCell = newRow.insertCell(7);
            const deleteButton = document.createElement("button");
            deleteButton.innerText = "Eliminar";
            deleteButton.className = "btn btn-danger btn-sm";
            deleteButton.onclick = function () {
                // Llamamos a la función de eliminación de ventas
                deleteSalesEntry(newRow, montoVenta, tipoDocumentoVenta, formaPagoVenta, ivaVenta);
            };
            deleteCell.appendChild(deleteButton);
        });

        // Actualiza la tabla mayor
        updateMayorTable();
    }
}


// PERSISTENCIA
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
            numeroDocumentoVenta: row.cells[2].innerText,
            montoVenta: parseFloat(row.cells[3].innerText) || 0,
            tipoDocumentoVenta: row.cells[5].innerText,  // Añadir tipo de documento
            formaPagoVenta: row.cells[4].innerText,  // Añadir forma de pago
            ivaVenta: parseFloat(row.cells[6].innerText) || 0,  // Añadir IVA de la venta
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
            numeroDocumentoCompra: row.cells[2].innerText, // Nuevo campo
            montoCompra: parseFloat(row.cells[3].innerText) || 0,
            formaPagoCompra: row.cells[4].innerText,
            tipoDocumentoCompra: row.cells[5].innerText, // Tipo de documento
            ivaCompra: parseFloat(row.cells[6].innerText) || 0, // IVA de la compra
        };
        purchaseData.push(rowData);
    });
    // Guardar los datos en el localStorage
    localStorage.setItem('purchaseData', JSON.stringify(purchaseData));
}

// Función para cargar las entradas del diario desde el localStorage
function loadDiaryFromLocalStorage() {
    const diaryData = JSON.parse(localStorage.getItem('diaryData'));
    if (diaryData && Array.isArray(diaryData)) {
        const table = document.getElementById("diaryTable").getElementsByTagName("tbody")[0];
        diaryData.forEach(({ fecha, codigoCuenta, cuenta, debe, haber }) => {
            const newRow = table.insertRow();
            newRow.insertCell(0).innerText = fecha;
            newRow.insertCell(1).innerText = codigoCuenta;
            newRow.insertCell(2).innerText = cuenta;
            newRow.insertCell(3).innerText = debe;
            newRow.insertCell(4).innerText = haber;

        });
    }
}

// Función para cargar las compras desde el localStorage y ordenarlas por fecha
function loadPurchasesFromLocalStorage() {
    const purchaseData = JSON.parse(localStorage.getItem('purchaseData'));
    if (purchaseData && Array.isArray(purchaseData)) {
        // Ordenar las compras por fecha en formato DD/MM/YYYY
        purchaseData.sort((a, b) => {
            const [dayA, monthA, yearA] = a.fechaCompra.split("/").map(Number);
            const [dayB, monthB, yearB] = b.fechaCompra.split("/").map(Number);
            const dateA = new Date(yearA, monthA - 1, dayA);
            const dateB = new Date(yearB, monthB - 1, dayB);
            return dateA - dateB; // Orden ascendente por fecha
        });

        // Obtener el cuerpo de la tabla
        const table = document.getElementById("purchaseTable").getElementsByTagName("tbody")[0];
        
        // Insertar las compras ordenadas en la tabla
        purchaseData.forEach(({ fechaCompra, proveedorCompra, numeroDocumentoCompra, montoCompra, tipoDocumentoCompra, ivaCompra, formaPagoCompra }) => {
            // Insertar una nueva fila en la tabla
            const newRow = table.insertRow();
            newRow.insertCell(0).innerText = fechaCompra;
            newRow.insertCell(1).innerText = proveedorCompra;
            newRow.insertCell(2).innerText = numeroDocumentoCompra; // Nuevo campo
            newRow.insertCell(3).innerText = montoCompra;
            newRow.insertCell(4).innerText = formaPagoCompra;
            newRow.insertCell(5).innerText = tipoDocumentoCompra; // Tipo de documento
            newRow.insertCell(6).innerText = ivaCompra; // IVA

            // Agregar botón "Eliminar" al final de la fila
            const deleteCell = newRow.insertCell(7);
            const deleteButton = document.createElement("button");
            deleteButton.innerText = "Eliminar";
            deleteButton.className = "btn btn-danger btn-sm";
            deleteButton.onclick = function () {
                deletePurchaseEntry(newRow, montoCompra, tipoDocumentoCompra, formaPagoCompra, ivaCompra); // Llama a la función de eliminación de compras
            };
            deleteCell.appendChild(deleteButton);
        });
        
        // Actualiza la tabla del Libro Mayor (si es necesario)
        updateMayorTable();
    }
}


function saveCuentasToLocalStorage() {
    localStorage.setItem('cuentas', JSON.stringify(cuentas));
}
function loadCuentasFromLocalStorage() {
    const cuentasData = JSON.parse(localStorage.getItem('cuentas'));
    if (cuentasData) {
        cuentas = cuentasData;  // Ahora puedes reasignar cuentas sin problemas
        updateMayorTable();  // Actualizar el libro mayor
    }
}

// FIN PERSISTENCIA


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
    const mayorHeaders = ["Fecha", "Codigo Cuenta", "Cuenta", "Debe", "Haber", "Saldo"];
    mayorData.push(mayorHeaders); // Cabecera de la tabla

    // Extraer los datos de la tabla mayor
    document.querySelectorAll('#mayorTable tbody tr').forEach(row => {
        const cells = row.querySelectorAll('td');

        // Si es una fila de saldo final (con cuenta y saldo), agregamos los datos
        if (cells.length === 6 && cells[2].textContent !== "") {
            const codigoCuenta = cells[1].textContent;
            const cuenta = cells[2].textContent;
            const saldo = cells[5].textContent;
            mayorData.push(["", codigoCuenta, cuenta, "", "", saldo]);
        }
        // Si es una fila de movimiento, agregamos la fecha, debe y haber
        else if (cells.length === 6 && cells[0].textContent !== "") {
            const fecha = cells[0].textContent;
            const debe = cells[3].textContent;
            const haber = cells[4].textContent;
            mayorData.push([fecha, "", debe, haber, ""]);
        }
    });

    // Crear la hoja de trabajo para el Libro Mayor
    const mayorWorksheet = XLSX.utils.aoa_to_sheet(mayorData);

    // Estilos para los encabezados
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


    // Dividir el Libro de Ventas en "Contribuyentes" y "Consumidor Final"
    const salesDataContribuyentes = [];
    const salesDataConsumidor = [];
    const salesHeaders = ["Fecha", "Cliente", "No. Documento", "Monto", "Forma de Pago", "Tipo Documento", "IVA"];
    
    salesDataContribuyentes.push(salesHeaders);  // Cabecera de contribuyentes
    salesDataConsumidor.push(salesHeaders);     // Cabecera de consumidores
    
    // Extraer los datos de la tabla de ventas
    document.querySelectorAll('#salesTable tbody tr').forEach(row => {
        const rowData = Array.from(row.children).map((cell, index) => {
            if (index === row.children.length - 1) {
                return null; // Omitir la columna "Eliminar"
            }
            return cell.textContent;
        }).filter(cell => cell !== null); // Filtrar celdas nulas
        
        const iva = parseFloat(rowData[6]); // IVA está en la columna 7 (índice 6)

        if (iva > 0) {
            // Si el IVA es mayor a 0, va al Libro de Contribuyentes
            salesDataContribuyentes.push(rowData);
        } else {
            // Si el IVA es 0, va al Libro de Consumidor Final
            salesDataConsumidor.push(rowData);
        }
    });

    // Crear hojas de trabajo para ambos libros
    const contribuyentesWorksheet = XLSX.utils.aoa_to_sheet(salesDataContribuyentes);
    const consumidorWorksheet = XLSX.utils.aoa_to_sheet(salesDataConsumidor);

    // Aplicar estilos a los encabezados y filas de ambos libros (Contribuyentes y Consumidor)
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

    // Aplicar el estilo de encabezado para Contribuyentes
    for (let col = 0; col < salesHeaders.length; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
        applyCellStyle(contribuyentesWorksheet, cellRef, salesHeaderStyle);
    }

    // Aplicar el estilo de encabezado para Consumidor Final
    for (let col = 0; col < salesHeaders.length; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
        applyCellStyle(consumidorWorksheet, cellRef, salesHeaderStyle);
    }

    // Aplicar estilo general a las filas de ambos libros
    for (let row = 1; row < salesDataContribuyentes.length; row++) {
        for (let col = 0; col < salesHeaders.length; col++) {
            const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
            applyCellStyle(contribuyentesWorksheet, cellRef, generalCellStyle);
        }
    }

    for (let row = 1; row < salesDataConsumidor.length; row++) {
        for (let col = 0; col < salesHeaders.length; col++) {
            const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
            applyCellStyle(consumidorWorksheet, cellRef, generalCellStyle);
        }
    }

    // Añadir las hojas de trabajo al libro
    XLSX.utils.book_append_sheet(wb, contribuyentesWorksheet, "Libro de Contribuyentes");
    XLSX.utils.book_append_sheet(wb, consumidorWorksheet, "Libro de Consumidor Final");

    /* Libro de Ventas
    const salesData = [];
    const salesHeaders = ["Fecha", "Cliente", "No. Documento", "Monto", "Forma de Pago", "Tipo Documento", "IVA"];
    salesData.push(salesHeaders);
    document.querySelectorAll('#salesTable tbody tr').forEach(row => {
        const rowData = Array.from(row.children).map((cell, index) => {
            // Omitir la última columna (columna "Eliminar", por ejemplo)
            if (index === row.children.length - 1) {
                return null; // No incluir la última columna
            }
            return cell.textContent;
        }).filter(cell => cell !== null); // Filtra las celdas null (eliminando la columna "Eliminar")
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
*/
    // Libro de Compras
    const purchaseData = [];
    const purchaseHeaders = ["Fecha", "Proveedor", "No. Documento", "Monto", "Forma de Pago", "Tipo Documento", "IVA"];
    purchaseData.push(purchaseHeaders);
    document.querySelectorAll('#purchaseTable tbody tr').forEach(row => {
        const rowData = Array.from(row.children).map((cell, index) => {
            // Omitir la columna "Eliminar" (si está presente en la tabla de compras)
            if (index === row.children.length - 1) {
                return null; // No incluir la última columna
            }
            return cell.textContent;
        }).filter(cell => cell !== null); // Filtra las celdas null
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

