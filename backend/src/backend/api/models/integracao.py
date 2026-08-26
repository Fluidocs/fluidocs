from tortoise import fields, models

class Integracao(models.Model):
    id = fields.IntField(pk=True)
    nome_integracao = fields.CharField(null=False, max_length=60)

    class Meta:
        table = "integracao"