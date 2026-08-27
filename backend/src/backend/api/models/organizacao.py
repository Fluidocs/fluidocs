from tortoise import fields, models

class Organizacao(models.Model):
    id = fields.IntField(pk=True)
    nome = fields.CharField(null=False, max_length=60)
    cnpj = fields.CharField(null=True, max_length=14)
    email = fields.CharField(null=False, max_length=100)
    senha = fields.CharField(null=False, max_length=60)
    logo = fields.CharField(null=True, max_length=100)

    class Meta:
        table = "organizacao"
