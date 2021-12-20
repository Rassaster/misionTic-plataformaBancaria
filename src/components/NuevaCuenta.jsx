import React, { useState } from 'react'

import Axios from 'axios'

export function NuevaCuenta() {
	const [cuentas, setCuentas] = useState([])
	const [aviso, setAviso] = useState('')

	let requireData = async () => {
		const accounts = await Axios.post(`${process.env.REACT_APP_URL}/getAccounts`, {
			activeUser: JSON.parse(localStorage.getItem("banAgrario")).userSession,
			fetchBy: "documento"
		})

		let listaCuentas = []
		accounts.data.forEach(e => {
			listaCuentas.push({
				cuenta: e.numCuenta,
				saldo: e.balance,
				id: e._id,
				estado: e.estado
			})
		})
		setCuentas(listaCuentas)
		setAviso('Cuenta creada exitosamente. Aguarde la aprobación de uno de nuestros asesores')
	}

	// useEffect(() => {
	// 	setAviso('Cuenta creada exitosamente. Aguarde la aprobación de uno de nuestros asesores')
	// }, [cuentas])

	function submitData(initialBalance) {
		Axios.post(`${process.env.REACT_APP_URL}/createAccount`, {
			numDoc: JSON.parse(localStorage.getItem("banAgrario")).userSession,
			numCuenta: Math.floor(Math.random() * (1000000 - 1)).toString(),
			estado: "pendActivacion",
			balance: initialBalance
		})
			.then((response) => {
				console.log("NuevaCuenta" + response.data)
			})
			.catch((error) => {
				console.log("NuevaCuenta" + error)
			})
	}

	function submitHandler(event) {
		event.preventDefault()
		const ammount = event.target.ammount.value
		submitData(ammount);
		document.getElementById('ammount').value = null
		requireData();
	}

	return (
		<>
			<form onSubmit={submitHandler} className='col-6 my-3'>
				<label htmlFor="ammount" className='form-label'>Ingrese el monto inicial de su cuenta:</label>
				<input className='form-control' type="number" name="ammount" id="ammount" step="10" min="0" required>
				</input>
				<button className="btn btn-primary mt-2" type="submit">Solicitar cuenta</button>
			</form>
			{Boolean(aviso) &&
				<div>
					{aviso}
					<table className="table table-hover">
						<thead>
							<tr>
								<th scope="col"># Cuenta</th>
								<th scope="col">Saldo</th>
								<th scope="col">Estado</th>
							</tr>
						</thead>
						<tbody>
							{cuentas.filter(ele => ele.estado === 'pendActivacion').map(e => {
								return (
									<tr className='text-body'>
										<th scope="row">{e.cuenta}</th>
										<td>$ {e.saldo.toFixed(2)}</td>
										<td>{e.estado}</td>
									</tr>
								)
							})}
						</tbody>
					</table>
				</div>
			}
		</>
	)
} 