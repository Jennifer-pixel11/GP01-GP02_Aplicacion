// Objeto para almacenar los saldos de cada cuenta
const cuentas = {
    "Ventas": { saldo: 0 },
    "Compras": { saldo: 0 },
    "Gastos": { saldo: 0 },
    "Ingresos": { saldo: 0 }
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

// Función para agregar una entrada en el Libro Diario y actualizar el saldo en el Libro Mayor
function addDiaryEntry(event) {
    event.preventDefault();
    const fecha = document.getElementById("fecha").value;
    const codigoCuenta = document.getElementById("codigoCuenta").value;
    const cuenta = document.getElementById("cuenta").value;
    const debito = parseFloat(document.getElementById("debito").value) || 0;
    const credito = parseFloat(document.getElementById("credito").value) || 0;

    const table = document.getElementById("diaryTable").getElementsByTagName("tbody")[0];
    
    // Validar si existe una entrada con la misma fecha
    let existingRow = Array.from(table.rows).find(row => row.cells[0].innerText === fecha);

    if (!existingRow) {
        const newRow = table.insertRow();
        newRow.insertCell(0).innerText = fecha;
        newRow.insertCell(1).innerText = codigoCuenta;
        newRow.insertCell(2).innerText = cuenta;
        newRow.insertCell(3).innerText = debito.toFixed(2);
        newRow.insertCell(4).innerText = credito.toFixed(2);
    } else {
        const newRow = table.insertRow();
        newRow.insertCell(0).innerText = ""; // Dejar vacío si es la misma fecha
        newRow.insertCell(1).innerText = codigoCuenta;
        newRow.insertCell(2).innerText = cuenta;
        newRow.insertCell(3).innerText = debito.toFixed(2);
        newRow.insertCell(4).innerText = credito.toFixed(2);
    }

    // Actualizar saldo en el objeto cuentas
    if (cuenta in cuentas) {
        cuentas[cuenta].saldo += debito - credito;
    } else {
        alert("La cuenta especificada no existe.");
    }

    // Llamar a la función para actualizar el Libro Mayor
    updateMayorTable();
    
    document.getElementById("diaryForm").reset();
}

// Función para actualizar el Libro Mayor en la tabla HTML
function updateMayorTable() {
    const mayorTableBody = document.querySelector('#mayorTable tbody');
    mayorTableBody.innerHTML = ''; // Limpiar la tabla anterior

    for (const [cuenta, { saldo }] of Object.entries(cuentas)) {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${cuenta}</td><td>${saldo.toFixed(2)}</td>`;
        mayorTableBody.appendChild(row);
    }
}
function addSalesEntry(event) {
    event.preventDefault();
    const fechaVenta = document.getElementById("fechaVenta").value;
    const clienteVenta = document.getElementById("clienteVenta").value;
    const montoVenta = parseFloat(document.getElementById("montoVenta").value) || 0;

    const table = document.getElementById("salesTable").getElementsByTagName("tbody")[0];
    const newRow = table.insertRow();
    newRow.insertCell(0).innerText = fechaVenta;
    newRow.insertCell(1).innerText = clienteVenta;
    newRow.insertCell(2).innerText = montoVenta;

    cuentas["Ventas"].saldo += montoVenta;
    updateMayorTable();

    document.getElementById("salesForm").reset();
}

function addPurchaseEntry(event) {
    event.preventDefault();
    const fechaCompra = document.getElementById("fechaCompra").value;
    const proveedorCompra = document.getElementById("proveedorCompra").value;
    const montoCompra = parseFloat(document.getElementById("montoCompra").value) || 0;

    const table = document.getElementById("purchaseTable").getElementsByTagName("tbody")[0];
    const newRow = table.insertRow();
    newRow.insertCell(0).innerText = fechaCompra;
    newRow.insertCell(1).innerText = proveedorCompra;
    newRow.insertCell(2).innerText = montoCompra;

    cuentas["Compras"].saldo += montoCompra;
    updateMayorTable();

    document.getElementById("purchaseForm").reset();
}



function exportAllToExcel() {
    const wb = XLSX.utils.book_new();

    const diaryData = [];
    const diaryHeaders = ["Fecha", "Código de Cuenta", "Cuenta", "Débito", "Crédito"];
    diaryData.push(diaryHeaders);
    document.querySelectorAll('#diaryTable tbody tr').forEach(row => {
        const rowData = Array.from(row.children).map(cell => cell.textContent);
        diaryData.push(rowData);
    });
    const diaryWorksheet = XLSX.utils.aoa_to_sheet(diaryData);
    XLSX.utils.book_append_sheet(wb, diaryWorksheet, "Libro Diario");

    const mayorData = [];
    const mayorHeaders = ["Cuenta", "Saldo"];
    mayorData.push(mayorHeaders);
    for (const [cuenta, { saldo }] of Object.entries(cuentas)) {
        mayorData.push([cuenta, saldo.toFixed(2)]);
    }
    const mayorWorksheet = XLSX.utils.aoa_to_sheet(mayorData);
    XLSX.utils.book_append_sheet(wb, mayorWorksheet, "Libro Mayor");

    const salesData = [];
    const salesHeaders = ["Fecha", "Cliente", "Monto"];
    salesData.push(salesHeaders);
    document.querySelectorAll('#salesTable tbody tr').forEach(row => {
        const rowData = Array.from(row.children).map(cell => cell.textContent);
        salesData.push(rowData);
    });
    const salesWorksheet = XLSX.utils.aoa_to_sheet(salesData);
    XLSX.utils.book_append_sheet(wb, salesWorksheet, "Libro de Ventas");

    const purchaseData = [];
    const purchaseHeaders = ["Fecha", "Proveedor", "Monto"];
    purchaseData.push(purchaseHeaders);
    document.querySelectorAll('#purchaseTable tbody tr').forEach(row => {
        const rowData = Array.from(row.children).map(cell => cell.textContent);
        purchaseData.push(rowData);
    });
    const purchaseWorksheet = XLSX.utils.aoa_to_sheet(purchaseData);
    XLSX.utils.book_append_sheet(wb, purchaseWorksheet, "Libro de Compras");

    XLSX.writeFile(wb, 'Catálogo_de_Cuentas_Gimnasio.xlsx');
}
