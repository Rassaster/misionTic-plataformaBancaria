require('dotenv').config()

const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const { MongoClient } = require('mongodb')

const { RegistroModel } = require("./models/Registro")
const { CuentasModel } = require("./models/Cuentas")
const { TransaccionesModel } = require("./models/Transacciones")
const URL = `mongodb+srv://${process.env.REACT_APP_USER}:${process.env.REACT_APP_PASSWORD}@banagrario.57kdk.mongodb.net/${process.env.REACT_APP_DB}?retryWrites=true&w=majority`
const app = express()

app.use(express.json())
app.use(cors())

app.post("/createUser", async (req, res) => {
	const user = req.body
	const newUser = new RegistroModel(user)
	let result

	mongoose.connect(URL)

	try {
		await newUser.save().then(() => {
			result = "Creating User succeed"
		})
	} catch (e) {
		result = "Saving account failed"
	}

	res.send(result)
})

app.post("/createTransaction", async (req, res) => {
	const tran = req.body
	const newTran = new TransaccionesModel(tran)
	let result

	mongoose.connect(URL)

	try {
		await newTran.save().then(() => {
			result = "Transaccion succeed"
		})
	} catch (e) {
		console.log("TransaccionesModel", e)
		result = "Transaccion failed"
	}

	res.send(result)
})

app.post("/createAccount", async (req, res) => {
	const acc = req.body
	const newAcc = new CuentasModel(acc)
	let result

	mongoose.connect(URL)

	try {
		await newAcc.save().then(() => {
			result = "Saving account succeed"
		})
	} catch (e) {
		result = "Saving account failed"
		console.log("Account failed: " + e)
	}

	res.send(result)
})

async function loginDataMatch(client, { user, pass }) {
	const result = await client.db(process.env.REACT_APP_DB).collection("clientes")
		.findOne({
			correo: user,
			pwd: pass
		})

	return result ? { typeUser: result.tipoUsuario, userSession: result.numDoc } : { typeUser: "noExiste" }
}

app.post("/routeUser", async (req, res) => {
	const client = new MongoClient(URL)

	try {
		await client.connect()
		const usuarioLogIn = await loginDataMatch(client, req.body)

		switch (usuarioLogIn.typeUser) {
			case "cliente":
				return res.status(200).send({ userSession: usuarioLogIn.userSession, url: "cliente" })
			case "empleado":
				return res.status(200).send({ userSession: usuarioLogIn.userSession, url: "empleado" })
			case "administrador":
				return res.status(200).send({ userSession: usuarioLogIn.userSession, url: "administrador" })
			default:
				return res.status(401).send({ userSession: "Usuario y/o contraseña no validos" })
		}
	} catch (e) {
		console.error(e)
	} finally {
		await client.close()
	}
})

app.post("/getAccounts", async (req, res) => {
	const activeUser = req.body.activeUser
	const DBField = req.body.fetchBy
	let datadb

	mongoose.connect(URL)

	if (DBField === "documento") {
		try {
			await CuentasModel.find({ numDoc: activeUser }).exec()
				.then((result) => {
					datadb = result
				})
		} catch (e) {
			console.log("getAccountsByDocumento failed: " + e)
		}
	} else if (DBField === "estado") {
		try {
			await CuentasModel.find({ estado: "pendiente" }).exec()
				.then((result) => {
					datadb = result
				})
		} catch (e) {
			console.log("getAccountsByEstado failed: " + e)
		}
	}

	res.json(datadb)
})

app.post("/exeChangeState", async (req, res) => {
	mongoose.connect(URL)
	let nuevoEstado = ''
	let resMsg = ''

	if (req.body.action === "aprobar") {
		nuevoEstado = "activa"
	} else {
		nuevoEstado = "rechazada"
	}

	try {
		await CuentasModel.updateOne(
			{ _id: req.body.id },
			{ $set: { estado: nuevoEstado } }
		)
			.then((response) => {
				resMsg = response.modifiedCount
			})
	} catch (error) {
		resMsg = "exeChangeState failed"
	}

	res.send(resMsg)
})

app.post("/fetchAccountData", async (req, res) => {
	mongoose.connect(URL)
	let accData = null

	try {
		await CuentasModel.findOne({ numCuenta: req.body.acc }).exec()
			.then((response) => {
				accData = response
			})
	} catch (error) {
		console.log("existAccount E", error)
	}

	res.json(accData)
})

app.post("/exeChangeBalance", async (req, res) => {
	mongoose.connect(URL)
	let resMsg = 0

	try {
		await CuentasModel.updateOne(
			{ _id: req.body.id },
			{ $set: { balance: req.body.newBalance } }
		)
			.then((response) => {
				resMsg = response.modifiedCount
			})
	} catch (error) {
		resMsg = "exeChangeBalance failed"
	}

	res.json({ result: resMsg })
})

app.post("/getTransactions", async (req, res) => {
	const doc = req.body.doc
	const acc = req.body.acc
	let trans = {}

	mongoose.connect(URL)

	try {
		const fetchData = await TransaccionesModel.find({
			$and: [
				{
					$or: [
						{ docFuente: doc },
						{ docDestino: doc }
					]
				},
				{
					$or: [
						{ fuente: acc },
						{ destino: acc }
					]
				}
			]
		})

		trans = fetchData.map((t) => {
			return {
				cobroBanco: t.cobroBanco,
				destino: t.destino,
				docDestino: t.docDestino,
				docFuente: t.docFuente,
				estado: t.estado,
				fecha: t.fecha,
				fuente: t.fuente,
				monto: t.monto,
				__v: t.__v,
				_id: t._id,
				tipoTrans: t.docFuente === doc ? "Enviada" : "Recibida"
			}
		})

	} catch (error) {
		console.log("getTransactions", error)
	}

	res.json(trans)
})

app.post("/getAccounts", async (req, res) => {
	const activeUser = req.body.activeUser
	const DBField = req.body.fetchBy
	let datadb

	mongoose.connect(URL)

	if (DBField === "documento") {


		try {
			await CuentasModel.find({ numDoc: activeUser }).exec()
				.then((result) => {
					datadb = result
				})
		} catch (e) {
			console.log("getAccountsByDocumento failed: " + e)
		}


	} else if (DBField === "estado") {
		try {
			await CuentasModel.find({ estado: "pendiente" }).exec()
				.then((result) => {
					datadb = result
				})
		} catch (e) {
			console.log("getAccountsByEstado failed: " + e)
		}
	}

	res.json(datadb)
})

app.listen(3001, () => {
	console.log("Server is running")
})